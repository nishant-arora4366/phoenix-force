'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { secureSessionManager } from '@/src/lib/secure-session'

interface Auction {
  id: string
  tournament_id: string | null
  start_time: string
  end_time: string
  starting_bid: number
  bid_increment: number
  description: string | null
  status: string
  created_by: string
  created_at: string
  updated_at: string
  tournaments?: {
    id: string
    name: string
    format: string
    tournament_date: string
    venue?: string
  }
}

export default function Auctions() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [liveAuctions, setLiveAuctions] = useState<Auction[]>([])
  const [completedAuctions, setCompletedAuctions] = useState<Auction[]>([])

  useEffect(() => {
    const getUser = async () => {
      const currentUser = secureSessionManager.getUser()
      setUser(currentUser)
      setLoading(false)
    }
    getUser()

    const unsubscribe = secureSessionManager.subscribe((userData) => {
      setUser(userData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const token = secureSessionManager.getToken()
        if (!token) return

        const response = await fetch('/api/auctions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const result = await response.json()
        if (result.success && result.auctions) {
          setAuctions(result.auctions)
          
          // Separate auctions by status
          const live = result.auctions.filter((a: Auction) => a.status === 'active' || a.status === 'live')
          const completed = result.auctions.filter((a: Auction) => a.status === 'completed' || a.status === 'finalized')
          
          setLiveAuctions(live)
          setCompletedAuctions(completed)
        }
      } catch (error) {
        console.error('Error fetching auctions:', error)
      }
    }

    if (user) {
      fetchAuctions()
    }
  }, [user])

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
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#DBD0C0] mb-2">
              Auctions
            </h1>
            <p className="text-lg text-[#CEA17A] max-w-3xl mx-auto mb-6">
              Real-time bidding system with race condition prevention and atomic transactions.
            </p>
            
            {/* Start Auction Button */}
            {user && (user.role === 'host' || user.role === 'admin') && (
              <div className="flex justify-center">
                <Link
                  href="/auctions/create"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Start Auction</span>
                </Link>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
                  {/* Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                  
                  <div className="relative z-10 flex items-center">
                    <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                      <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[#CEA17A]">Total Auctions</p>
                      <p className="text-2xl font-bold text-[#DBD0C0]">{auctions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
                  {/* Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                  
                  <div className="relative z-10 flex items-center">
                    <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                      <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[#CEA17A]">Live Now</p>
                      <p className="text-2xl font-bold text-[#DBD0C0]">{liveAuctions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
                  {/* Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                  
                  <div className="relative z-10 flex items-center">
                    <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                      <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[#CEA17A]">Upcoming</p>
                      <p className="text-2xl font-bold text-[#DBD0C0]">{auctions.filter(a => a.status === 'scheduled').length}</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
                  {/* Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                  
                  <div className="relative z-10 flex items-center">
                    <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                      <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[#CEA17A]">Completed</p>
                      <p className="text-2xl font-bold text-[#DBD0C0]">{completedAuctions.length}</p>
                    </div>
                  </div>
                </div>
          </div>

          {/* Live Auctions Section */}
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#DBD0C0] mb-6">
              Live Auctions
            </h2>
            
            {liveAuctions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[#CEA17A] mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-lg text-[#CEA17A]">
                  No live auctions at the moment
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveAuctions.map((auction) => (
                  <div
                    key={auction.id}
                    className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-xl border border-[#CEA17A]/25 p-6 hover:border-[#CEA17A]/40 transition-all duration-200"
                  >
                    {/* Live Badge */}
                    <div className="flex items-center mb-4">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="ml-2 text-sm font-semibold text-green-400">LIVE</span>
                    </div>

                    {/* Tournament Info */}
                    {auction.tournaments && (
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-[#DBD0C0] mb-1">
                          {auction.tournaments.name}
                        </h3>
                        <p className="text-sm text-[#CEA17A]">
                          {auction.tournaments.format}
                        </p>
                      </div>
                    )}

                    {/* Auction Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#CEA17A]">Starting Bid:</span>
                        <span className="text-[#DBD0C0] font-semibold">${auction.starting_bid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#CEA17A]">Bid Increment:</span>
                        <span className="text-[#DBD0C0] font-semibold">${auction.bid_increment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#CEA17A]">Ends:</span>
                        <span className="text-[#DBD0C0]">
                          {new Date(auction.end_time).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      <Link
                        href={`/auctions/${auction.id}`}
                        className="block w-full px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 text-center font-medium"
                      >
                        Join Auction
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Auctions Section */}
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#DBD0C0] mb-6">
              Completed Auctions
            </h2>
            
            {completedAuctions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[#CEA17A] mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-lg text-[#CEA17A]">
                  No completed auctions yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedAuctions.map((auction) => (
                  <div
                    key={auction.id}
                    className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-xl border border-[#CEA17A]/25 p-6 hover:border-[#CEA17A]/40 transition-all duration-200"
                  >
                    {/* Completed Badge */}
                    <div className="flex items-center mb-4">
                      <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="ml-2 text-sm font-semibold text-green-400">COMPLETED</span>
                    </div>

                    {/* Tournament Info */}
                    {auction.tournaments && (
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-[#DBD0C0] mb-1">
                          {auction.tournaments.name}
                        </h3>
                        <p className="text-sm text-[#CEA17A]">
                          {auction.tournaments.format}
                        </p>
                      </div>
                    )}

                    {/* Auction Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#CEA17A]">Starting Bid:</span>
                        <span className="text-[#DBD0C0] font-semibold">${auction.starting_bid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#CEA17A]">Completed:</span>
                        <span className="text-[#DBD0C0]">
                          {new Date(auction.end_time).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      <Link
                        href={`/auctions/${auction.id}`}
                        className="block w-full px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 text-center font-medium"
                      >
                        View Results
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
