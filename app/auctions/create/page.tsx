'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'

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
  venue?: string
  google_maps_link?: string
  created_at: string
  updated_at: string
}

export default function CreateAuctionPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  const [auctionData, setAuctionData] = useState({
    tournament_id: '',
    start_time: '',
    end_time: '',
    starting_bid: '',
    bid_increment: '',
    description: ''
  })

  useEffect(() => {
    const getUser = async () => {
      const currentUser = sessionManager.getUser()
      setUser(currentUser)
      setLoading(false)
    }
    getUser()

    const unsubscribe = sessionManager.subscribe((userData) => {
      setUser(userData)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/tournaments')
        const result = await response.json()
        if (result.tournaments) {
          setTournaments(result.tournaments)
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error)
      }
    }
    fetchTournaments()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setAuctionData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirmModal(true)
  }

  const confirmCreate = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...auctionData,
          tournament_id: selectedTournament
        }),
      })

      if (response.ok) {
        // Redirect to auctions page
        window.location.href = '/auctions'
      } else {
        const error = await response.json()
        alert(`Error creating auction: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating auction:', error)
      alert('Error creating auction')
    } finally {
      setIsSubmitting(false)
      setShowConfirmModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-[#DBD0C0]">Loading...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-[#DBD0C0] mb-6">
                  Please Sign In
                </h1>
                <p className="text-xl text-[#CEA17A] mb-8">
                  You need to be signed in to create auctions.
                </p>
                <button
                  onClick={() => window.location.href = '/signin'}
                  className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (user.role !== 'host' && user.role !== 'admin') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-[#DBD0C0] mb-6">
                  Access Denied
                </h1>
                <p className="text-xl text-[#CEA17A] mb-8">
                  You need host or admin privileges to create auctions.
                </p>
                <button
                  onClick={() => window.location.href = '/auctions'}
                  className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                >
                  Return to Auctions
                </button>
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
      
      {/* Content */}
      <div className="relative z-10 py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#DBD0C0] mb-2">
                  Create New Auction
                </h1>
                <p className="text-lg text-[#CEA17A]">
                  Set up a new auction for tournament players
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tournament Selection */}
                <div>
                  <label htmlFor="tournament_id" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                    Select Tournament *
                  </label>
                  <select
                    id="tournament_id"
                    name="tournament_id"
                    value={selectedTournament}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  >
                    <option value="">Choose a tournament...</option>
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name} - {new Date(tournament.tournament_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                    Auction Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    name="start_time"
                    value={auctionData.start_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                    Auction End Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="end_time"
                    name="end_time"
                    value={auctionData.end_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                  />
                </div>

                {/* Starting Bid */}
                <div>
                  <label htmlFor="starting_bid" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                    Starting Bid Amount *
                  </label>
                  <input
                    type="number"
                    id="starting_bid"
                    name="starting_bid"
                    value={auctionData.starting_bid}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter starting bid amount"
                    className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  />
                </div>

                {/* Bid Increment */}
                <div>
                  <label htmlFor="bid_increment" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                    Bid Increment *
                  </label>
                  <input
                    type="number"
                    id="bid_increment"
                    name="bid_increment"
                    value={auctionData.bid_increment}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter minimum bid increment"
                    className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                    Auction Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={auctionData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe the auction rules and any special conditions..."
                    className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating Auction...' : 'Create Auction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative bg-[#09171F]/95 backdrop-blur-sm rounded-xl shadow-2xl border border-[#CEA17A]/20 p-8 max-w-md mx-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#DBD0C0] mb-4">Confirm Auction Creation</h3>
              <p className="text-[#CEA17A] mb-6">
                Are you sure you want to create this auction? This action cannot be undone.
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCreate}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
