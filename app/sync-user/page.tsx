'use client'

import { useState } from 'react'
import { sessionManager } from '@/lib/session'
import { supabase } from '@/lib/supabaseClient'

export default function SyncUserPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)

  const syncUser = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Get current user
      const currentUser = sessionManager.getUser()
      
      if (!currentUser) {
        setMessage('Please sign in first')
        return
      }

      setUser(currentUser)

      // Check if user already exists in public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (existingUser) {
        setMessage('User already synced!')
        return
      }

      // Sync user to public.users table
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          role: 'viewer'
        })
        .select()
        .single()

      if (error) throw error

      setMessage('User synced successfully! You can now create players and tournaments.')
      
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Sync User Account
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            After registering, you need to sync your account to the Phoenix Force database 
            to access all features like creating players and tournaments.
          </p>

          {user && (
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Current User:
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>ID:</strong> {user.id}
              </p>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.includes('Error') 
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={syncUser}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Syncing...' : 'Sync My Account'}
            </button>

            <div className="text-center">
              <a
                href="/"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to Home
              </a>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Why do I need to sync?
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Supabase Auth creates users in the auth system, but Phoenix Force uses a custom 
              users table for role management and additional features. This sync ensures your 
              account is properly set up in the Phoenix Force database.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
