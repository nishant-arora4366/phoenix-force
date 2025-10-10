'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { secureSessionManager } from '@/src/lib/secure-session'

function SignInContent() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      const currentUser = secureSessionManager.getUser()
      setUser(currentUser)
    }
    getUser()

    // Listen for auth changes
    const unsubscribe = secureSessionManager.subscribe((userData) => {
      setUser(userData)
    })

    return () => unsubscribe()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Use custom login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }
      
      setMessage(result.message || 'Successfully signed in!')
      setUser(result.user)
      
      // Set user and token in secure session manager
      secureSessionManager.setUser(result.user, result.token)
      
      // Redirect immediately after successful sign in
      console.log('User signed in successfully, redirecting to:', returnUrl)
      router.push(returnUrl)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
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
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#DBD0C0] mb-2">
                Welcome Back
              </h1>
              <p className="text-[#CEA17A]">
                Sign in to your Phoenix Force account
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  placeholder="Enter your password"
                />
              </div>
              
              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  message.includes('Error') 
                    ? 'bg-[#75020f]/15 text-[#75020f] border border-[#75020f]/25'
                    : 'bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25'
                }`}>
                  {message}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-[#CEA17A] text-sm">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-200"
                >
                  Sign up here
                </Link>
              </p>
              <p className="mt-2 text-[#CEA17A] text-sm">
                <Link
                  href="/"
                  className="font-medium text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-200"
                >
                  ← Return to homepage
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#19171b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA17A] mx-auto"></div>
          <p className="mt-2 text-[#DBD0C0]">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}

