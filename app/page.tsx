'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthForm from '@/components/AuthForm'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  Phoenix Force Cricket
                </h1>
              </div>
            </div>

            {/* Navigation Links and User Auth */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/players"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Players
                </Link>
                <Link
                  href="/tournaments"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Tournaments
                </Link>
                <Link
                  href="/tournaments/create"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Create Tournament
                </Link>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      Welcome, {user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                    <Link
                      href="/sync-user"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Sync Account
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/signin"
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Sign in to access features
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900 inline-flex items-center justify-center p-2 rounded-md"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

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
            {user && (
              <div className="max-w-md mx-auto mb-12">
                <div className="p-4 bg-gray-100 text-gray-800 rounded-lg">
                  <p className="text-sm">
                    <strong>Welcome back, {user.email}!</strong>
                  </p>
                  <div className="mt-2">
                    <Link
                      href="/sync-user"
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Sync your account to access all features →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-200">
                <div className="text-gray-700 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Player Management</h3>
                <p className="text-gray-600">
                  Comprehensive player profiles with ratings, skills, and performance tracking.
                </p>
                <Link
                  href="/players"
                  className="inline-block mt-4 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Browse Players →
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-200">
                <div className="text-gray-700 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tournament Management</h3>
                <p className="text-gray-600">
                  Create and manage tournaments with advanced auction systems and real-time bidding.
                </p>
                <Link
                  href="/tournaments"
                  className="inline-block mt-4 text-gray-700 hover:text-gray-900 font-medium"
                >
                  View Tournaments →
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-200">
                <div className="text-gray-700 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Auctions</h3>
                <p className="text-gray-600">
                  Real-time bidding system with race condition prevention and atomic transactions.
                </p>
                <Link
                  href="/tournaments/create"
                  className="inline-block mt-4 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Create Tournament →
                </Link>
              </div>
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
