'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRoleValidation } from '@/src/hooks/useRoleValidation'

export default function CreateAuctionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const { user } = useRoleValidation()

  useEffect(() => {
    setLoading(false)
  }, [user])

  const handleTournamentAuction = () => {
    // TODO: Navigate to tournament selection step
    console.log('Tournament Auction selected')
  }

  const handleQuickAuction = () => {
    // TODO: Navigate to quick auction setup
    console.log('Quick Auction selected')
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

  // Show unauthorized message if user doesn't have host or admin access
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
            <div className="text-center">
              <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 max-w-2xl mx-auto">
                <div className="text-red-400 mb-6">
                  <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4">
                  Access Denied
                </h2>
                <p className="text-[#CEA17A] mb-6">
                  You don't have permission to create auctions. Only hosts and admins can access this feature.
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
                  <button
                    onClick={() => router.push('/auctions')}
                    className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    Back to Auctions
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    Go Home
                  </button>
                </div>
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#DBD0C0] mb-4">
                Create New Auction
              </h1>
              <p className="text-lg text-[#CEA17A]">
                Choose how you want to start your auction
              </p>
            </div>

            {/* Two Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Select Tournament */}
              <button
                onClick={handleTournamentAuction}
                className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 hover:border-[#CEA17A]/40 hover:bg-[#09171F]/70 transition-all duration-200 text-left group"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-[#3E4E5A]/15 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3E4E5A]/25 transition-all duration-200">
                      <svg className="w-8 h-8 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#DBD0C0] mb-3">
                      Select Tournament
                    </h2>
                    <p className="text-[#CEA17A] leading-relaxed">
                      Create an auction linked to an existing tournament with all player and tournament details
                    </p>
                  </div>
                  <div className="mt-auto">
                    <span className="inline-flex items-center text-[#CEA17A] group-hover:text-[#DBD0C0] transition-colors duration-200">
                      Get Started
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 2: Quick Auction */}
              <button
                onClick={handleQuickAuction}
                className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 hover:border-[#CEA17A]/40 hover:bg-[#09171F]/70 transition-all duration-200 text-left group"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-[#3E4E5A]/15 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3E4E5A]/25 transition-all duration-200">
                      <svg className="w-8 h-8 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#DBD0C0] mb-3">
                      Start Quick Auction
                    </h2>
                    <p className="text-[#CEA17A] leading-relaxed">
                      Start a standalone auction without tournament data. Configure details later as needed
                    </p>
                  </div>
                  <div className="mt-auto">
                    <span className="inline-flex items-center text-[#CEA17A] group-hover:text-[#DBD0C0] transition-colors duration-200">
                      Get Started
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
