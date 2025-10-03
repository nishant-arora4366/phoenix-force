'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface TournamentFormData {
  name: string
  format: string
  selected_teams: number
  tournament_date: string
  description: string
  total_slots: number
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    format: '8 Team',
    selected_teams: 8,
    tournament_date: '',
    description: '',
    total_slots: 88
  })

  // Check if user is authenticated and is a host
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user is a host
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData?.role === 'host' || userData?.role === 'admin') {
          setUser(user)
        } else {
          setMessage('Only hosts and admins can create tournaments. Your current role: ' + (userData?.role || 'unknown'))
        }
      } else {
        setMessage('Please sign in to create tournaments')
      }
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name: formData.name,
          format: formData.format,
          selected_teams: formData.selected_teams,
          tournament_date: formData.tournament_date,
          description: formData.description,
          total_slots: formData.total_slots,
          host_id: user.id,
          status: 'draft'
        })
        .select()
        .single()

      if (tournamentError) throw tournamentError

      // Create tournament slots
      const slots = Array.from({ length: formData.total_slots }, (_, i) => ({
        tournament_id: tournament.id,
        slot_number: i + 1,
        status: 'empty'
      }))

      const { error: slotsError } = await supabase
        .from('tournament_slots')
        .insert(slots)

      if (slotsError) throw slotsError

      setMessage('Tournament created successfully!')
      
      // Redirect to tournament management or tournaments list
      setTimeout(() => {
        router.push('/tournaments')
      }, 2000)

    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name.includes('slots') || name.includes('selected_teams') || name.includes('amount') || name.includes('increment') 
          ? Number(value) 
          : value
      }
      
      // Auto-update selected teams and total slots when format changes
      if (name === 'format') {
        const formatRecommendations: { [key: string]: { teams: number, slots: number } } = {
          'Bilateral': { teams: 2, slots: 22 },
          'TriSeries': { teams: 3, slots: 33 },
          'Quad': { teams: 4, slots: 44 },
          '6 Team': { teams: 6, slots: 66 },
          '8 Team': { teams: 8, slots: 88 },
          '10 Team': { teams: 10, slots: 110 },
          '12 Team': { teams: 12, slots: 132 },
          '16 Team': { teams: 16, slots: 176 },
          '20 Team': { teams: 20, slots: 220 },
          '24 Team': { teams: 24, slots: 264 },
          '32 Team': { teams: 32, slots: 352 }
        }
        
        const recommendation = formatRecommendations[value] || { teams: 8, slots: 88 }
        newData.selected_teams = recommendation.teams
        newData.total_slots = recommendation.slots
      }
      
      return newData
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message || 'You need to be a host to create tournaments.'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Tournament</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set up a new tournament and configure auction settings
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter tournament name"
              />
            </div>

            {/* Tournament Format */}
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tournament Format *
              </label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Bilateral">Bilateral (2 Teams)</option>
                <option value="TriSeries">TriSeries (3 Teams)</option>
                <option value="Quad">Quad (4 Teams)</option>
                <option value="6 Team">6 Team</option>
                <option value="8 Team">8 Team</option>
                <option value="10 Team">10 Team</option>
                <option value="12 Team">12 Team</option>
                <option value="16 Team">16 Team</option>
                <option value="20 Team">20 Team</option>
                <option value="24 Team">24 Team</option>
                <option value="32 Team">32 Team</option>
              </select>
            </div>

            {/* Selected Teams */}
            <div>
              <label htmlFor="selected_teams" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Teams *
              </label>
              <input
                type="number"
                id="selected_teams"
                name="selected_teams"
                value={formData.selected_teams}
                onChange={handleInputChange}
                required
                min="2"
                max="32"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Number of teams participating in the tournament
              </p>
            </div>

            {/* Tournament Date */}
            <div>
              <label htmlFor="tournament_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tournament Date *
              </label>
              <input
                type="date"
                id="tournament_date"
                name="tournament_date"
                value={formData.tournament_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter tournament description (optional)"
              />
            </div>

            {/* Total Slots */}
            <div>
              <label htmlFor="total_slots" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Player Slots *
              </label>
              <input
                type="number"
                id="total_slots"
                name="total_slots"
                value={formData.total_slots}
                onChange={handleInputChange}
                required
                min="22"
                max="352"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total number of player slots (recommended: {formData.format === 'Bilateral' ? '22' : formData.format === 'TriSeries' ? '33' : formData.format === 'Quad' ? '44' : formData.format === '6 Team' ? '66' : formData.format === '8 Team' ? '88' : formData.format === '10 Team' ? '110' : formData.format === '12 Team' ? '132' : formData.format === '16 Team' ? '176' : formData.format === '20 Team' ? '220' : formData.format === '24 Team' ? '264' : formData.format === '32 Team' ? '352' : '88'})
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('Error') 
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>

        {/* Tournament Preview */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Tournament Preview
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Name:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">
                {formData.name || 'Untitled Tournament'}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Slots:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">{formData.total_slots}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Min Bid:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">₹{formData.min_bid_amount}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Min Increment:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">₹{formData.min_increment}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
