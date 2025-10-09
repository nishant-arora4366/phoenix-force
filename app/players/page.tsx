'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'

interface Player {
  id: string
  display_name: string
  stage_name?: string
  bio?: string
  profile_pic_url?: string
  base_price: number
  group_name?: string
  is_bowler: boolean
  is_batter: boolean
  is_wicket_keeper: boolean
  bowling_rating?: number
  batting_rating?: number
  wicket_keeping_rating?: number
  created_at: string
  skills?: { [key: string]: string | string[] }
}

const fetcher = async (url: string) => {
  // Get current user for role-based skill filtering
  const currentUser = sessionManager.getUser()
  
  const response = await fetch(url, {
    headers: {
      'Authorization': JSON.stringify(currentUser || { role: 'viewer' })
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch players')
  }
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch players')
  }
  
  return result.data
}

export default function PlayersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCommunity, setFilterCommunity] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  const { data: players, error, isLoading, mutate } = useSWR<Player[]>('/api/players-public', fetcher)

  // Get user info for permissions
  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoadingUser(true)
        const currentUser = sessionManager.getUser()
        if (currentUser) {
          setUser(currentUser)
          setUserRole(currentUser.role || null)
        } else {
          setUser(null)
          setUserRole(null)
        }
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
        setUserRole(null)
      } finally {
        setIsLoadingUser(false)
      }
    }
    getUser()

    // Listen for auth changes
    const unsubscribe = sessionManager.subscribe((userData) => {
      if (userData) {
        setUser(userData)
        setUserRole(userData.role || null)
      } else {
        setUser(null)
        setUserRole(null)
      }
      setIsLoadingUser(false)
    })

    return () => unsubscribe()
  }, [])


  const filteredPlayers = players?.filter(player => {
    const matchesSearch = player.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.stage_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCommunity = filterCommunity.length === 0 || 
      (player.skills?.Community && 
        (Array.isArray(player.skills.Community) ? 
          filterCommunity.some(community => player.skills?.Community?.includes(community)) :
          filterCommunity.includes(player.skills.Community)))
    
    const matchesRole = filterRole.length === 0 || 
      (player.skills?.Role && 
        (Array.isArray(player.skills.Role) ? 
          filterRole.some(roleFilter => 
            (player.skills?.Role as string[]).some((role: string) => {
              if (roleFilter === 'bowler') return role.toLowerCase().includes('bowler')
              if (roleFilter === 'batter') return role.toLowerCase().includes('batter')
              if (roleFilter === 'wicket_keeper') return role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk')
              return false
            })
          ) :
          filterRole.some(roleFilter => {
            const role = player.skills?.Role as string
            if (roleFilter === 'bowler') return role?.toLowerCase().includes('bowler')
            if (roleFilter === 'batter') return role?.toLowerCase().includes('batter')
            if (roleFilter === 'wicket_keeper') return role?.toLowerCase().includes('wicket') || role?.toLowerCase().includes('wk')
            return false
          })))
    
    return matchesSearch && matchesCommunity && matchesRole
  })?.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.display_name.localeCompare(b.display_name)
      case 'price':
        return b.base_price - a.base_price
      case 'batting':
        return (b.batting_rating || 0) - (a.batting_rating || 0)
      case 'bowling':
        return (b.bowling_rating || 0) - (a.bowling_rating || 0)
      default:
        return 0
    }
  })

  const uniqueCommunities = Array.from(new Set(
    players?.flatMap(player => {
      if (player.skills?.Community) {
        return Array.isArray(player.skills.Community) ? player.skills.Community : [player.skills.Community]
      }
      return []
    }).filter(Boolean)
  )) || []

  const handleDelete = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to delete ${playerName}? This action cannot be undone.`)) {
      return
    }

    try {
      const currentUser = sessionManager.getUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': JSON.stringify(currentUser)
        }
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete player')
      }

      // Refresh the players list
      mutate()
    } catch (error: any) {
      console.error('Error deleting player:', error)
      alert(`Error: ${error.message}`)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#19171b] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h2 className="text-lg font-semibold">Error loading players</h2>
                <p className="text-sm mt-1">{error.message}</p>
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
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      {/* Background Glowing Orbs - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#75020f]/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-[#51080d]/4 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#2b0307]/5 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#CEA17A]/2 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/2 left-1/2 w-56 h-56 bg-[#75020f]/3 rounded-full blur-md animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      {/* Sharp Geometric Elements - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-[#CEA17A]/6 rotate-45 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-[#75020f]/8 rotate-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-[#51080d]/7 rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-5 h-5 bg-[#2b0307]/9 rotate-12 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-[#CEA17A]/5 rotate-45 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-2/3 left-1/5 w-3 h-3 bg-[#75020f]/6 rotate-12 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/3 right-1/5 w-5 h-5 bg-[#51080d]/8 rotate-45 animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-[#2b0307]/7 rotate-12 animate-pulse" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-[#CEA17A]/4 rotate-45 animate-pulse" style={{animationDelay: '3.5s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-3 h-3 bg-[#75020f]/5 rotate-12 animate-pulse" style={{animationDelay: '1.2s'}}></div>
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#DBD0C0] mb-2 sm:mb-4">
              Player Roster
            </h1>
            <p className="text-[#CEA17A] text-base sm:text-lg">
              Discover talented cricketers and build your dream team
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="bg-[#09171F]/50 rounded-lg px-4 py-2 shadow-sm border border-[#CEA17A]/20">
              <span className="text-sm text-[#CEA17A]">
                {isLoading ? 'Loading...' : `${filteredPlayers?.length || 0} players`}
              </span>
            </div>
            {isLoadingUser ? (
              <div className="bg-[#09171F]/50 animate-pulse px-4 py-2 rounded-lg h-10 w-24 border border-[#CEA17A]/20"></div>
            ) : (userRole === 'admin' || userRole === 'host') ? (
              <button
                onClick={() => router.push('/players/create')}
                className="bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium px-4 py-2"
              >
                Add Player
              </button>
            ) : null}
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="bg-[#09171F]/50 rounded-xl shadow-sm border border-[#CEA17A]/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#CEA17A]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search players by name..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#CEA17A]/20 rounded-lg focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                  />
                </div>
              </div>

              {/* Community Filter */}
              <div className="sm:w-48">
                <div className="relative">
                  <select
                    multiple
                    value={filterCommunity}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                      setFilterCommunity(selectedOptions)
                    }}
                    className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-lg focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] min-h-[3rem]"
                    size={Math.min(uniqueCommunities.length + 1, 6)}
                  >
                    {uniqueCommunities.map(community => (
                      <option key={community} value={community}>{community}</option>
                    ))}
                  </select>
                  {filterCommunity.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-[#CEA17A] text-[#09171F] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {filterCommunity.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Role Filter */}
              <div className="sm:w-48">
                <div className="relative">
                  <select
                    multiple
                    value={filterRole}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                      setFilterRole(selectedOptions)
                    }}
                    className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-lg focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] min-h-[3rem]"
                    size={4}
                  >
                    <option value="bowler">Bowler</option>
                    <option value="batter">Batter</option>
                    <option value="wicket_keeper">Wicket Keeper</option>
                  </select>
                  {filterRole.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-[#CEA17A] text-[#09171F] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {filterRole.length}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[#CEA17A]">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border-2 border-[#CEA17A]/20 rounded-lg focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="batting">Batting Rating</option>
                  <option value="bowling">Bowling Rating</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#19171b]/50 rounded-lg p-1 border border-[#CEA17A]/20">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-[#CEA17A]/20 text-[#CEA17A] shadow-sm' : 'text-[#CEA17A]/60 hover:text-[#CEA17A]'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-[#CEA17A]/20 text-[#CEA17A] shadow-sm' : 'text-[#CEA17A]/60 hover:text-[#CEA17A]'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Players Display */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
              <p className="text-[#CEA17A]">Loading players...</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredPlayers?.map((player) => (
              <div 
                key={player.id} 
                onClick={() => router.push(`/players/${player.id}`)}
                className="group relative aspect-square overflow-hidden bg-gradient-to-br from-[#3E4E5A] to-[#09171F] rounded-xl shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-300 cursor-pointer"
              >
                {/* Player Image Background */}
                {player.profile_pic_url ? (
                  <img
                    src={player.profile_pic_url}
                    alt={player.display_name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-6xl text-[#CEA17A]/60">🏏</div>
                  </div>
                )}
                
                
                {/* Action Buttons - Top Right */}
                {(userRole === 'admin' || userRole === 'host') && (
                  <div className="absolute top-3 right-3 flex space-x-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/players/${player.id}/edit`)
                      }}
                      className="bg-black/50 text-white border border-white/20 shadow-lg backdrop-blur-sm rounded-lg hover:bg-black/70 hover:border-white/40 transition-all duration-150 text-xs py-1 px-2"
                      title="Edit Player"
                    >
                      ✏️
                    </button>
                    {userRole === 'admin' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(player.id, player.display_name)
                        }}
                        className="bg-red-500/80 text-white border border-red-400/50 shadow-lg backdrop-blur-sm rounded-lg hover:bg-red-600/80 hover:border-red-300/70 transition-all duration-150 text-xs py-1 px-2"
                        title="Delete Player"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
                
                {/* Group Badge - Top Left */}
                {player.group_name && (
                  <div className="absolute top-3 left-3 bg-black/50 text-white border border-white/20 px-2 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm">
                    {player.group_name}
                  </div>
                )}

                {/* Player Name - Bottom Left with Gradient Background */}
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {player.display_name}
                    </h3>
                    
                    {/* Role Icons */}
                    {player.skills?.Role && (
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(player.skills.Role) ? (
                          player.skills.Role.map((role, index) => {
                            const roleEmoji = role.toLowerCase().includes('batter') ? '🏏' : 
                                            role.toLowerCase().includes('bowler') ? '🎾' : 
                                            role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk') ? '🧤' : '🧤'
                            return (
                              <span key={index} className="text-lg">
                                {roleEmoji}
                              </span>
                            )
                          })
                        ) : (
                          (() => {
                            const role = player.skills.Role
                            const roleEmoji = role.toLowerCase().includes('batter') ? '🏏' : 
                                            role.toLowerCase().includes('bowler') ? '🎾' : 
                                            role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk') ? '🧤' : '🧤'
                            return (
                              <span className="text-lg">
                                {roleEmoji}
                              </span>
                            )
                          })()
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlayers?.map((player) => (
              <div key={player.id} className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl shadow-xl border border-[#CEA17A]/20 p-4 sm:p-6 hover:animate-border-glow transition-all duration-300">
                {/* Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Player Avatar */}
                  <div className="flex-shrink-0 flex items-center space-x-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-[#3E4E5A] to-[#09171F] flex items-center justify-center overflow-hidden border border-[#CEA17A]/20">
                      {player.profile_pic_url ? (
                        <img
                          src={player.profile_pic_url}
                          alt={player.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-xl sm:text-2xl text-[#CEA17A]/60">🏏</div>
                      )}
                    </div>
                    
                    {/* Mobile: Player name and price */}
                    <div className="flex-1 sm:hidden">
                      <h3 className="text-lg font-semibold text-[#DBD0C0]">
                        {player.display_name}
                      </h3>
                      <div className="text-lg font-bold text-[#CEA17A]">₹{player.base_price}</div>
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#DBD0C0]">
                          {player.display_name}
                        </h3>
                        {player.stage_name && (
                          <p className="text-sm text-[#CEA17A]/70 italic">"{player.stage_name}"</p>
                        )}
                        {player.group_name && (
                          <span className="inline-block bg-[#3E4E5A]/20 text-[#DBD0C0] border border-[#3E4E5A]/30 text-xs px-2 py-1 rounded-full mt-1 backdrop-blur-sm">
                            {player.group_name}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#CEA17A]">₹{player.base_price}</div>
                        <div className="flex items-center space-x-4 mt-2">
                          {player.batting_rating && (
                            <span className="text-sm text-[#CEA17A]">Bat: {player.batting_rating}/10</span>
                          )}
                          {player.bowling_rating && (
                            <span className="text-sm text-[#CEA17A]">Bowl: {player.bowling_rating}/10</span>
                          )}
                          {player.wicket_keeping_rating && (
                            <span className="text-sm text-[#CEA17A]">WK: {player.wicket_keeping_rating}/10</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile layout */}
                    <div className="sm:hidden">
                      {player.stage_name && (
                        <p className="text-sm text-[#CEA17A]/70 italic mb-2">"{player.stage_name}"</p>
                      )}
                      {player.group_name && (
                        <span className="inline-block bg-[#3E4E5A]/20 text-[#DBD0C0] border border-[#3E4E5A]/30 text-xs px-2 py-1 rounded-full mb-2 backdrop-blur-sm">
                          {player.group_name}
                        </span>
                      )}
                    </div>

                    {/* Ratings - Mobile */}
                    <div className="sm:hidden flex flex-wrap gap-2 mb-3">
                      {player.batting_rating && (
                        <span className="text-xs text-[#CEA17A] bg-[#CEA17A]/20 border border-[#CEA17A]/30 px-2 py-1 rounded backdrop-blur-sm">Bat: {player.batting_rating}/10</span>
                      )}
                      {player.bowling_rating && (
                        <span className="text-xs text-[#CEA17A] bg-[#CEA17A]/20 border border-[#CEA17A]/30 px-2 py-1 rounded backdrop-blur-sm">Bowl: {player.bowling_rating}/10</span>
                      )}
                      {player.wicket_keeping_rating && (
                        <span className="text-xs text-[#CEA17A] bg-[#CEA17A]/20 border border-[#CEA17A]/30 px-2 py-1 rounded backdrop-blur-sm">WK: {player.wicket_keeping_rating}/10</span>
                      )}
                    </div>

                    {/* Role */}
                    {player.skills?.Role && (
                      <div className="mb-3">
                        <div className="text-xs text-[#CEA17A]/70 font-medium mb-1">Role</div>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(player.skills.Role) ? (
                            player.skills.Role.map((role, index) => {
                          const roleEmoji = role.toLowerCase().includes('batter') ? '🏏' : 
                                          role.toLowerCase().includes('bowler') ? '🎾' : 
                                          role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk') ? '🧤' : '🧤'
                              return (
                                <span key={index} className="text-lg">
                                  {roleEmoji}
                                </span>
                              )
                            })
                          ) : (
                            (() => {
                              const role = player.skills.Role
                          const roleEmoji = role.toLowerCase().includes('batter') ? '🏏' : 
                                          role.toLowerCase().includes('bowler') ? '🎾' : 
                                          role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk') ? '🧤' : '🧤'
                              return (
                                <span className="text-lg">
                                  {roleEmoji}
                                </span>
                              )
                            })()
                          )}
                        </div>
                      </div>
                    )}

                    {/* Community */}
                    {player.skills?.Community && (
                      <div className="mb-3">
                        <div className="text-xs text-[#CEA17A]/70 font-medium mb-1">Community</div>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(player.skills.Community) ? (
                            player.skills.Community.map((community, index) => (
                              <span key={index} className="bg-[#3E4E5A]/20 text-[#DBD0C0] border border-[#3E4E5A]/30 text-xs px-2 py-1 rounded backdrop-blur-sm">
                                {community}
                              </span>
                            ))
                          ) : (
                            <span className="bg-[#3E4E5A]/20 text-[#DBD0C0] border border-[#3E4E5A]/30 text-xs px-2 py-1 rounded backdrop-blur-sm">
                              {player.skills.Community}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {player.bio && (
                      <div className="text-sm text-[#CEA17A]/80 mb-3">
                        {player.bio.length > 80 ? (
                          <div>
                            <span className="line-clamp-1">
                              {player.bio.substring(0, 80)}...
                            </span>
                            <button 
                              onClick={() => router.push(`/players/${player.id}`)}
                              className="text-[#CEA17A] hover:text-[#CEA17A]/80 text-xs ml-1"
                            >
                              more
                            </button>
                          </div>
                        ) : (
                          <p className="line-clamp-1">{player.bio}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button 
                      onClick={() => router.push(`/players/${player.id}`)}
                      className="w-full sm:w-auto bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 text-xs py-1.5 px-3"
                    >
                      View Details
                    </button>
                    {isLoadingUser ? (
                      <>
                        <div className="w-full sm:w-auto bg-[#09171F]/50 animate-pulse py-1.5 px-2 rounded-lg h-7 border border-[#CEA17A]/20"></div>
                        <div className="w-full sm:w-auto bg-[#09171F]/50 animate-pulse py-1.5 px-2 rounded-lg h-7 border border-[#CEA17A]/20"></div>
                      </>
                    ) : (userRole === 'admin' || userRole === 'host') ? (
                      <>
                        <button 
                          onClick={() => router.push(`/players/${player.id}/edit`)}
                          className="w-full sm:w-auto bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#3E4E5A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#3E4E5A]/40 transition-all duration-150 text-xs py-1.5 px-2"
                        >
                          Edit
                        </button>
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => handleDelete(player.id, player.display_name)}
                            className="w-full sm:w-auto bg-red-500/15 text-red-300 border border-red-500/25 shadow-lg shadow-red-500/10 backdrop-blur-sm rounded-lg hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-150 text-xs py-1.5 px-2"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPlayers?.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-[#09171F]/50 rounded-xl shadow-sm border border-[#CEA17A]/20 p-12 max-w-md mx-auto">
              <div className="text-6xl mb-6">🏏</div>
              <h3 className="text-xl font-semibold text-[#DBD0C0] mb-2">
                No players found
              </h3>
              <p className="text-[#CEA17A] mb-6">
                Try adjusting your search filters or check back later for new players.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('')
                  setFilterCommunity([])
                  setFilterRole([])
                }}
                className="bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium px-6 py-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
