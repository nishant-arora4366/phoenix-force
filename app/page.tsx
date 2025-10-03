'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setIsLoading(false)
      }
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="text-gray-700">Phoenix Force Cricket</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The ultimate platform for cricket tournament management with advanced auction systems, 
              player ratings, and real-time bidding.
            </p>
            
                {/* Welcome Message for Logged In Users */}
                {!isLoading && user && (
                  <div className="max-w-md mx-auto mb-12">
                    <div className="p-4 bg-gray-100 text-gray-800 rounded-lg">
                      <p className="text-sm">
                        <strong>Welcome back, {user.email}!</strong>
                      </p>
                      <div className="mt-2">
                        <Link
                          href="/profile"
                          className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                          View your profile →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <Link
                href="/players"
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="text-gray-700 mb-4 group-hover:text-gray-900 transition-colors">
                    <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Player Management</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Comprehensive player profiles with ratings, skills, and performance tracking.
                  </p>
                  <div className="text-gray-700 group-hover:text-gray-900 font-medium transition-colors">
                    Browse Players →
                  </div>
                </div>
              </Link>

              <Link
                href="/tournaments"
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="text-gray-700 mb-4 group-hover:text-gray-900 transition-colors">
                    <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Tournament Management</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Create and manage tournaments with advanced auction systems and real-time bidding.
                  </p>
                  <div className="text-gray-700 group-hover:text-gray-900 font-medium transition-colors">
                    View Tournaments →
                  </div>
                </div>
              </Link>

              <Link
                href="/auctions"
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="text-gray-700 mb-4 group-hover:text-gray-900 transition-colors">
                    <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Live Auctions</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Real-time bidding system with race condition prevention and atomic transactions.
                  </p>
                  <div className="text-gray-700 group-hover:text-gray-900 font-medium transition-colors">
                    View Auctions →
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">20+</div>
                <div className="text-gray-600">API Endpoints</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">100%</div>
                <div className="text-gray-600">Race Condition Safe</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">Real-time</div>
                <div className="text-gray-600">Live Bidding</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">Admin</div>
                <div className="text-gray-600">Role Management</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
