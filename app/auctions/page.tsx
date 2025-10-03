'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function Auctions() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-700">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Live Auctions
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Real-time bidding system with race condition prevention and atomic transactions.
          </p>

          {/* Coming Soon Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto border border-gray-200">
            <div className="text-gray-700 mb-6">
              <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              The live auction system is currently under development. This will include:
            </p>
            <ul className="text-left text-gray-600 space-y-2 mb-8">
              <li>• Real-time bidding with WebSocket connections</li>
              <li>• Race condition prevention with atomic transactions</li>
              <li>• Live auction status updates</li>
              <li>• Bid history and analytics</li>
              <li>• Tournament-specific auction management</li>
            </ul>
            <div className="flex space-x-4 justify-center">
              <Link
                href="/tournaments"
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                View Tournaments
              </Link>
              <Link
                href="/players"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Browse Players
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
