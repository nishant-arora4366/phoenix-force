'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface Tournament {
  id: string
  name: string
  host_id: string
  status: string
  total_slots: number
  min_bid_amount?: number
  min_increment?: number
  created_at: string
  updated_at: string
}

const fetcher = async (url: string) => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    case 'registration_open':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    case 'registration_closed':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
    case 'auction_started':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
    case 'auction_completed':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'registration_open':
      return 'Registration Open'
    case 'registration_closed':
      return 'Registration Closed'
    case 'auction_started':
      return 'Auction Started'
    case 'auction_completed':
      return 'Auction Completed'
    default:
      return status
  }
}

export default function TournamentsPage() {
  const [user, setUser] = useState<any>(null)
  const [isHost, setIsHost] = useState(false)

  const { data: tournaments, error, isLoading, mutate } = useSWR<Tournament[]>('/api/tournaments', fetcher)

  // Check user authentication and role
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Check if user is a host
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData?.role === 'host') {
          setIsHost(true)
        }
      }
    }
    checkUser()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Error loading tournaments</h2>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tournaments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and participate in tournaments
            </p>
          </div>
          {isHost && (
            <Link
              href="/tournaments/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Tournament
            </Link>
          )}
        </div>

        {/* Tournaments Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments?.map((tournament) => (
              <div key={tournament.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  {/* Tournament Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {tournament.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                      {getStatusText(tournament.status)}
                    </span>
                  </div>

                  {/* Tournament Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Slots:</span>
                      <span className="font-medium">{tournament.total_slots}</span>
                    </div>
                    
                    {tournament.min_bid_amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Min Bid:</span>
                        <span className="font-medium">₹{tournament.min_bid_amount}</span>
                      </div>
                    )}
                    
                    {tournament.min_increment && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Min Increment:</span>
                        <span className="font-medium">₹{tournament.min_increment}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="font-medium">
                        {new Date(tournament.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-2">
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                    
                    {isHost && tournament.host_id === user?.id && (
                      <Link
                        href={`/tournaments/${tournament.id}/manage`}
                        className="flex-1 px-3 py-2 bg-gray-600 text-white text-center rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Manage
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tournaments?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tournaments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isHost ? 'Create your first tournament to get started.' : 'Check back later for new tournaments.'}
            </p>
            {isHost && (
              <Link
                href="/tournaments/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Tournament
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
