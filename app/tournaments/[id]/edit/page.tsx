'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { sessionManager } from '@/lib/session'

interface Tournament {
  id: string
  name: string
  format: string
  selected_teams: number
  tournament_date: string
  description?: string
  host_id: string
  status: string
  total_slots: number
  created_at: string
  updated_at: string
}

export default function EditTournamentPage() {
  const router = useRouter()
  const params = useParams()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    format: '8 Team',
    selected_teams: 8,
    tournament_date: '',
    description: '',
    total_slots: 88
  })

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        // Get current user from session manager
        const sessionUser = sessionManager.getUser()
        if (!sessionUser) {
          router.push('/signin')
          return
        }
        setUser(sessionUser)

        // Fetch tournament data via API
        const response = await fetch(`/api/tournaments/${tournamentId}`)
        if (!response.ok) {
          setError('Tournament not found')
          return
        }
        
        const result = await response.json()
        if (!result.success) {
          setError('Tournament not found')
          return
        }
        
        const tournamentData = result.tournament

        // Check if user is the host or an admin
        if (!sessionUser) {
          setError('User not authenticated')
          return
        }

        const userResponse = await fetch(`/api/user-profile?userId=${sessionUser.id}`)
        if (!userResponse.ok) {
          setError('Unable to verify user permissions')
          return
        }
        
        const userResult = await userResponse.json()
        if (!userResult.success) {
          setError('Unable to verify user permissions')
          return
        }
        
        const userData = userResult.data

        if (tournamentData.host_id !== sessionUser.id && userData?.role !== 'admin') {
          setError('You are not authorized to edit this tournament')
          return
        }

        setTournament(tournamentData)
        setFormData({
          name: tournamentData.name,
          format: tournamentData.format || '8 Team',
          selected_teams: tournamentData.selected_teams || 8,
          tournament_date: tournamentData.tournament_date || '',
          description: tournamentData.description || '',
          total_slots: tournamentData.total_slots || 88
        })
      } catch (error) {
        console.error('Error fetching tournament:', error)
        setError('Error loading tournament')
      } finally {
        setIsLoading(false)
      }
    }

    if (tournamentId) {
      fetchTournament()
    }
  }, [tournamentId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        router.push(`/tournaments/${tournamentId}`)
      } else {
        setError(result.error || 'Failed to update tournament')
      }
    } catch (error) {
      console.error('Error updating tournament:', error)
      setError('Error updating tournament')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_slots' || name === 'selected_teams' 
        ? parseInt(value) || 0 
        : value
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournament...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Error</h2>
          <p className="text-sm">{error}</p>
          <Link
            href="/tournaments"
            className="inline-block mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Tournaments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/tournaments"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Tournament</h1>
          </div>
          <p className="text-gray-600">
            Update tournament details and settings
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                placeholder="Enter tournament name"
              />
            </div>

            {/* Tournament Format */}
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Format *
              </label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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
              <label htmlFor="selected_teams" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Teams *
              </label>
              <input
                type="number"
                id="selected_teams"
                name="selected_teams"
                value={formData.selected_teams}
                onChange={handleChange}
                required
                min="2"
                max="32"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                placeholder="Number of teams"
              />
            </div>

            {/* Tournament Date */}
            <div>
              <label htmlFor="tournament_date" className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Date *
              </label>
              <input
                type="date"
                id="tournament_date"
                name="tournament_date"
                value={formData.tournament_date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                placeholder="Enter tournament description (optional)"
              />
            </div>

            {/* Total Slots */}
            <div>
              <label htmlFor="total_slots" className="block text-sm font-medium text-gray-700 mb-2">
                Total Player Slots *
              </label>
              <input
                type="number"
                id="total_slots"
                name="total_slots"
                value={formData.total_slots}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                placeholder="Total player slots"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 text-red-800 p-4 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Updating...' : 'Update Tournament'}
              </button>
              <Link
                href="/tournaments"
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
