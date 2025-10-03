'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabaseClient'

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
}

const fetcher = async (url: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export default function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const { data: players, error, isLoading, mutate } = useSWR<Player[]>('/api/players', fetcher)

  const filteredPlayers = players?.filter(player => {
    const matchesSearch = player.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.stage_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = !filterGroup || player.group_name === filterGroup
    const matchesRole = !filterRole || 
      (filterRole === 'bowler' && player.is_bowler) ||
      (filterRole === 'batter' && player.is_batter) ||
      (filterRole === 'wicket_keeper' && player.is_wicket_keeper)
    
    return matchesSearch && matchesGroup && matchesRole
  })

  const uniqueGroups = [...new Set(players?.map(p => p.group_name).filter(Boolean))]

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Error loading players</h2>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Players</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Browse and manage player profiles
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Players
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Group Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group
              </label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Groups</option>
                {uniqueGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Roles</option>
                <option value="bowler">Bowler</option>
                <option value="batter">Batter</option>
                <option value="wicket_keeper">Wicket Keeper</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading ? 'Loading...' : `${filteredPlayers?.length || 0} players`}
              </div>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers?.map((player) => (
              <div key={player.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Player Image */}
                <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {player.profile_pic_url ? (
                    <img
                      src={player.profile_pic_url}
                      alt={player.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 text-4xl">
                      👤
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {player.display_name}
                  </h3>
                  {player.stage_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      "{player.stage_name}"
                    </p>
                  )}
                  
                  {player.group_name && (
                    <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full mt-2">
                      {player.group_name}
                    </span>
                  )}

                  {/* Roles */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {player.is_bowler && (
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">
                        Bowler
                      </span>
                    )}
                    {player.is_batter && (
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
                        Batter
                      </span>
                    )}
                    {player.is_wicket_keeper && (
                      <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                        WK
                      </span>
                    )}
                  </div>

                  {/* Ratings */}
                  <div className="mt-4 space-y-2">
                    {player.batting_rating && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Batting:</span>
                        <span className="font-medium">{player.batting_rating}/10</span>
                      </div>
                    )}
                    {player.bowling_rating && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Bowling:</span>
                        <span className="font-medium">{player.bowling_rating}/10</span>
                      </div>
                    )}
                    {player.wicket_keeping_rating && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Wicket Keeping:</span>
                        <span className="font-medium">{player.wicket_keeping_rating}/10</span>
                      </div>
                    )}
                  </div>

                  {/* Base Price */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Base Price:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₹{player.base_price}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {player.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                      {player.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPlayers?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No players found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
