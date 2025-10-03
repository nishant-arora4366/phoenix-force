'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthFormExtended from '@/components/AuthFormExtended'
import { supabase } from '@/lib/supabaseClient'

export default function SignIn() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

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

  const handleAuthChange = (user: any) => {
    setUser(user)
    if (user) {
      // Redirect to homepage after successful sign in
      router.push('/')
    }
  }

  return (
    <div>
      {/* Sign In Form */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/"
              className="font-medium text-gray-600 hover:text-gray-900"
            >
              return to homepage
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
            <AuthFormExtended onAuthChange={handleAuthChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
