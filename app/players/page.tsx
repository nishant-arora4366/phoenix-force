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
  const [filterGroup, setFilterGroup] = useState('')
  const [filterRole, setFilterRole] = useState('')
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
    const matchesGroup = !filterGroup || player.group_name === filterGroup
    const matchesRole = !filterRole || 
      (filterRole === 'bowler' && player.is_bowler) ||
      (filterRole === 'batter' && player.is_batter) ||
      (filterRole === 'wicket_keeper' && player.is_wicket_keeper)
    
    return matchesSearch && matchesGroup && matchesRole
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

  const uniqueGroups = Array.from(new Set(players?.map(p => p.group_name).filter(Boolean)))

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl shadow-sm">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Modern Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">
                Player Roster
              </h1>
              <p className="text-gray-500 mt-2 text-base sm:text-lg">
                Discover talented cricketers and build your dream team
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                <span className="text-sm text-gray-600">
                  {isLoading ? 'Loading...' : `${filteredPlayers?.length || 0} players`}
                </span>
              </div>
              {isLoadingUser ? (
                <div className="bg-gray-200 animate-pulse px-4 py-2 rounded-lg h-10 w-24"></div>
              ) : (userRole === 'admin' || userRole === 'host') ? (
                <button
                  onClick={() => router.push('/players/create')}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Add Player
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Modern Filters & Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search players by name..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Group Filter */}
              <div className="sm:w-48">
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Groups</option>
                  {uniqueGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div className="sm:w-48">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Roles</option>
                  <option value="bowler">Bowler</option>
                  <option value="batter">Batter</option>
                  <option value="wicket_keeper">Wicket Keeper</option>
                </select>
              </div>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="batting">Batting Rating</option>
                  <option value="bowling">Bowling Rating</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading players...</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers?.map((player) => (
              <div key={player.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 h-full flex flex-col">
                {/* Player Image */}
                <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {player.profile_pic_url ? (
                    <img
                      src={player.profile_pic_url}
                      alt={player.display_name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-6xl text-gray-400">🏏</div>
                    </div>
                  )}
                  
                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                    ₹{player.base_price}
                  </div>
                  
                  {/* Group Badge */}
                  {player.group_name && (
                    <div className="absolute top-4 left-4 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      {player.group_name}
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-600 transition-colors">
                      {player.display_name}
                    </h3>
                    {player.stage_name && (
                      <p className="text-sm text-gray-500 italic">
                        "{player.stage_name}"
                      </p>
                    )}
                  </div>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {player.is_bowler && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                        🏏 Bowler
                      </span>
                    )}
                    {player.is_batter && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                        ⚾ Batter
                      </span>
                    )}
                    {player.is_wicket_keeper && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                        🧤 WK
                      </span>
                    )}
                    {/* Display additional skills from the skills object */}
                    {player.skills && Object.entries(player.skills).map(([skillName, skillValue]) => {
                      // Skip if it's already displayed as a role above
                      if (['Role', 'Base Price'].includes(skillName)) return null;
                      
                      return (
                        <span key={skillName} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                          {skillName}: {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                        </span>
                      );
                    })}
                  </div>

                  {/* Ratings */}
                  <div className="space-y-3 mb-4">
                    {player.batting_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Batting</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-gray-600 h-2 rounded-full" 
                              style={{ width: `${(player.batting_rating / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{player.batting_rating}/10</span>
                        </div>
                      </div>
                    )}
                    {player.bowling_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Bowling</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-gray-600 h-2 rounded-full" 
                              style={{ width: `${(player.bowling_rating / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{player.bowling_rating}/10</span>
                        </div>
                      </div>
                    )}
                    {player.wicket_keeping_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Wicket Keeping</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-gray-600 h-2 rounded-full" 
                              style={{ width: `${(player.wicket_keeping_rating / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{player.wicket_keeping_rating}/10</span>
                        </div>
                      </div>
                    )}
                    {/* Display additional skills as ratings */}
                    {player.skills && Object.entries(player.skills).map(([skillName, skillValue]) => {
                      // Skip if it's already displayed above or is not a rating
                      if (['Role', 'Base Price', 'Batting Rating', 'Bowling Rating', 'Wicket Keeping Rating'].includes(skillName)) return null;
                      
                      return (
                        <div key={skillName} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{skillName}</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bio */}
                  {player.bio && (
                    <div className="text-sm text-gray-600 mb-4">
                      {player.bio.length > 100 ? (
                        <div>
                          <span className="line-clamp-2">
                            {player.bio.substring(0, 100)}...
                          </span>
                          <button 
                            onClick={() => router.push(`/players/${player.id}`)}
                            className="text-gray-500 hover:text-gray-700 text-xs mt-1 block"
                          >
                            Show more →
                          </button>
                        </div>
                      ) : (
                        <p className="line-clamp-2">{player.bio}</p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 mt-auto">
                    <button 
                      onClick={() => router.push(`/players/${player.id}`)}
                      className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      View Details
                    </button>
                    {isLoadingUser ? (
                      <div className="flex space-x-2">
                        <div className="flex-1 bg-gray-200 animate-pulse py-2 px-3 rounded-lg h-9"></div>
                        <div className="flex-1 bg-gray-200 animate-pulse py-2 px-3 rounded-lg h-9"></div>
                      </div>
                    ) : (userRole === 'admin' || userRole === 'host') ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => router.push(`/players/${player.id}/edit`)}
                          className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => handleDelete(player.id, player.display_name)}
                            className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlayers?.map((player) => (
              <div key={player.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Player Avatar */}
                  <div className="flex-shrink-0 flex items-center space-x-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      {player.profile_pic_url ? (
                        <img
                          src={player.profile_pic_url}
                          alt={player.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-xl sm:text-2xl text-gray-400">🏏</div>
                      )}
                    </div>
                    
                    {/* Mobile: Player name and price */}
                    <div className="flex-1 sm:hidden">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {player.display_name}
                      </h3>
                      <div className="text-lg font-bold text-gray-700">₹{player.base_price}</div>
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {player.display_name}
                        </h3>
                        {player.stage_name && (
                          <p className="text-sm text-gray-500 italic">"{player.stage_name}"</p>
                        )}
                        {player.group_name && (
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full mt-1">
                            {player.group_name}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-700">₹{player.base_price}</div>
                        <div className="flex items-center space-x-4 mt-2">
                          {player.batting_rating && (
                            <span className="text-sm text-gray-600">Bat: {player.batting_rating}/10</span>
                          )}
                          {player.bowling_rating && (
                            <span className="text-sm text-gray-600">Bowl: {player.bowling_rating}/10</span>
                          )}
                          {player.wicket_keeping_rating && (
                            <span className="text-sm text-gray-600">WK: {player.wicket_keeping_rating}/10</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile layout */}
                    <div className="sm:hidden">
                      {player.stage_name && (
                        <p className="text-sm text-gray-500 italic mb-2">"{player.stage_name}"</p>
                      )}
                      {player.group_name && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full mb-2">
                          {player.group_name}
                        </span>
                      )}
                    </div>

                    {/* Ratings - Mobile */}
                    <div className="sm:hidden flex flex-wrap gap-2 mb-3">
                      {player.batting_rating && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">Bat: {player.batting_rating}/10</span>
                      )}
                      {player.bowling_rating && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">Bowl: {player.bowling_rating}/10</span>
                      )}
                      {player.wicket_keeping_rating && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">WK: {player.wicket_keeping_rating}/10</span>
                      )}
                    </div>

                    {/* Roles */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {player.is_bowler && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Bowler</span>
                      )}
                      {player.is_batter && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Batter</span>
                      )}
                      {player.is_wicket_keeper && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">WK</span>
                      )}
                    </div>

                    {/* Bio */}
                    {player.bio && (
                      <div className="text-sm text-gray-600 mb-3">
                        {player.bio.length > 80 ? (
                          <div>
                            <span className="line-clamp-1">
                              {player.bio.substring(0, 80)}...
                            </span>
                            <button 
                              onClick={() => router.push(`/players/${player.id}`)}
                              className="text-gray-500 hover:text-gray-700 text-xs ml-1"
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
                      className="w-full sm:w-auto bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    {isLoadingUser ? (
                      <>
                        <div className="w-full sm:w-auto bg-gray-200 animate-pulse py-2 px-3 rounded-lg h-9"></div>
                        <div className="w-full sm:w-auto bg-gray-200 animate-pulse py-2 px-3 rounded-lg h-9"></div>
                      </>
                    ) : (userRole === 'admin' || userRole === 'host') ? (
                      <>
                        <button 
                          onClick={() => router.push(`/players/${player.id}/edit`)}
                          className="w-full sm:w-auto bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => handleDelete(player.id, player.display_name)}
                            className="w-full sm:w-auto bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors text-sm"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
              <div className="text-6xl mb-6">🏏</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No players found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search filters or check back later for new players.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('')
                  setFilterGroup('')
                  setFilterRole('')
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
