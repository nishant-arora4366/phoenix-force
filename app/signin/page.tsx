'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthFormExtended from '@/src/components/AuthFormExtended'
import { sessionManager } from '@/src/lib/session'

function SignInContent() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      const currentUser = sessionManager.getUser()
      setUser(currentUser)
    }
    getUser()

    // Listen for auth changes
    const unsubscribe = sessionManager.subscribe((userData) => {
      setUser(userData)
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    sessionManager.clearUser()
    setUser(null)
  }

  const handleAuthChange = (user: any) => {
    setUser(user)
    if (user) {
      // Redirect immediately after successful sign in
      console.log('User signed in successfully, redirecting to:', returnUrl)
      router.push(returnUrl)
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

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}

