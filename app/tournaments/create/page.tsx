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
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
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
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Check if user is a host
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setUserRole(userData?.role || null)
          
          if (userData?.role === 'host' || userData?.role === 'admin') {
            setUser(user)
          } else {
            setMessage('Only hosts and admins can create tournaments. Your current role: ' + (userData?.role || 'unknown'))
          }
        } else {
          setMessage('Please sign in to create tournaments')
        }
      } catch (error) {
        console.error('Error checking user:', error)
        setMessage('Error checking authentication status')
      } finally {
        setIsLoadingUser(false)
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

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Checking Access...
              </h2>
              <p className="text-gray-600">
                Verifying your permissions to create tournaments
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied if user is not authenticated or doesn't have permission
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-6">
                {message || 'You need to be a host or admin to create tournaments.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/signin')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Tournament</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Set up your tournament with advanced configuration options and smart recommendations
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Tournament Configuration</h2>
            <p className="text-blue-100 mt-2">Configure your tournament settings below</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Tournament Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Tournament Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50"
                    placeholder="Enter a memorable tournament name"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tournament Format */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Tournament Format *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'Bilateral', label: 'Bilateral', teams: 2, color: 'from-blue-500 to-blue-600' },
                    { value: 'TriSeries', label: 'TriSeries', teams: 3, color: 'from-green-500 to-green-600' },
                    { value: 'Quad', label: 'Quad', teams: 4, color: 'from-purple-500 to-purple-600' },
                    { value: '6 Team', label: '6 Team', teams: 6, color: 'from-orange-500 to-orange-600' },
                    { value: '8 Team', label: '8 Team', teams: 8, color: 'from-pink-500 to-pink-600' },
                    { value: '10 Team', label: '10 Team', teams: 10, color: 'from-indigo-500 to-indigo-600' },
                    { value: '12 Team', label: '12 Team', teams: 12, color: 'from-teal-500 to-teal-600' },
                    { value: '16 Team', label: '16 Team', teams: 16, color: 'from-red-500 to-red-600' },
                    { value: '20 Team', label: '20 Team', teams: 20, color: 'from-yellow-500 to-yellow-600' },
                    { value: '24 Team', label: '24 Team', teams: 24, color: 'from-cyan-500 to-cyan-600' },
                    { value: '32 Team', label: '32 Team', teams: 32, color: 'from-gray-500 to-gray-600' }
                  ].map((format) => (
                    <div
                      key={format.value}
                      className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 ${
                        formData.format === format.value
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => handleInputChange({ target: { name: 'format', value: format.value } } as any)}
                    >
                      <div className={`p-4 rounded-lg bg-gradient-to-r ${format.color} text-white`}>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{format.teams}</div>
                          <div className="text-sm opacity-90">{format.label}</div>
                        </div>
                      </div>
                      {formData.format === format.value && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Teams & Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Selected Teams */}
                <div className="space-y-2">
                  <label htmlFor="selected_teams" className="block text-sm font-semibold text-gray-700">
                    Number of Teams *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="selected_teams"
                      name="selected_teams"
                      value={formData.selected_teams}
                      onChange={handleInputChange}
                      required
                      min="2"
                      max="32"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50"
                      placeholder="Number of teams"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Tournament Date */}
                <div className="space-y-2">
                  <label htmlFor="tournament_date" className="block text-sm font-semibold text-gray-700">
                    Tournament Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="tournament_date"
                      name="tournament_date"
                      value={formData.tournament_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                  Tournament Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50 resize-none"
                  placeholder="Describe your tournament, rules, prizes, or any special information..."
                />
              </div>

              {/* Total Slots */}
              <div className="space-y-2">
                <label htmlFor="total_slots" className="block text-sm font-semibold text-gray-700">
                  Total Player Slots *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="total_slots"
                    name="total_slots"
                    value={formData.total_slots}
                    onChange={handleInputChange}
                    required
                    min="22"
                    max="352"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50"
                    placeholder="Total player slots"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Recommended:</span> {formData.format === 'Bilateral' ? '22' : formData.format === 'TriSeries' ? '33' : formData.format === 'Quad' ? '44' : formData.format === '6 Team' ? '66' : formData.format === '8 Team' ? '88' : formData.format === '10 Team' ? '110' : formData.format === '12 Team' ? '132' : formData.format === '16 Team' ? '176' : formData.format === '20 Team' ? '220' : formData.format === '24 Team' ? '264' : formData.format === '32 Team' ? '352' : '88'} slots for {formData.format} format
                  </p>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-xl border-2 ${
                  message.includes('Error') 
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-5 h-5 mr-3 ${
                      message.includes('Error') ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {message.includes('Error') ? (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}

              {/* Submit Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Ready to Create?</h3>
                    <p className="text-sm text-gray-600">Review your settings and create your tournament</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Tournament...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Tournament
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Tournament Preview */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Tournament Preview</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Tournament Name</div>
              <div className="text-lg font-semibold text-gray-900">
                {formData.name || 'Untitled Tournament'}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Format</div>
              <div className="text-lg font-semibold text-gray-900">{formData.format}</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Teams</div>
              <div className="text-lg font-semibold text-gray-900">{formData.selected_teams}</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Player Slots</div>
              <div className="text-lg font-semibold text-gray-900">{formData.total_slots}</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Date</div>
              <div className="text-lg font-semibold text-gray-900">
                {formData.tournament_date ? new Date(formData.tournament_date).toLocaleDateString() : 'Not set'}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
              <div className="text-lg font-semibold text-green-600">Draft</div>
            </div>
          </div>
          
          {formData.description && (
            <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="text-sm font-medium text-gray-500 mb-2">Description</div>
              <div className="text-gray-900">{formData.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
