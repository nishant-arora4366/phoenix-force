'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { sessionManager } from '@/src/lib/session'

export default function Auctions() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const currentUser = sessionManager.getUser()
      setUser(currentUser)
      setLoading(false)
    }
    getUser()

    const unsubscribe = sessionManager.subscribe((userData) => {
      setUser(userData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
                      <p className="text-2xl font-bold text-[#DBD0C0]">0</p>
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
                      <p className="text-2xl font-bold text-[#DBD0C0]">0</p>
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
                      <p className="text-2xl font-bold text-[#DBD0C0]">0</p>
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
                      <p className="text-2xl font-bold text-[#DBD0C0]">0</p>
                    </div>
                  </div>
                </div>
          </div>

          {/* Live Auctions Section */}
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#DBD0C0] mb-6">
                Live Auctions
              </h2>
              
              {/* Coming Soon Card */}
              <div className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-2xl mx-auto border border-[#CEA17A]/25">
                <div className="text-[#CEA17A] mb-6">
                  <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4">
                  Coming Soon
                </h2>
                <p className="text-[#CEA17A] mb-6">
                  The live auction system is currently under development. This will include:
                </p>
                <ul className="text-left text-[#DBD0C0] space-y-2 mb-8">
                  <li>• Real-time bidding with WebSocket connections</li>
                  <li>• Race condition prevention with atomic transactions</li>
                  <li>• Live auction status updates</li>
                  <li>• Bid history and analytics</li>
                  <li>• Tournament-specific auction management</li>
                </ul>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
                  <Link
                    href="/tournaments"
                    className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    View Tournaments
                  </Link>
                  <Link
                    href="/players"
                    className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    Browse Players
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
