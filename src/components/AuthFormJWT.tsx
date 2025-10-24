'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/auth-api'

interface AuthFormProps {
  onAuthChange?: (user: any) => void
}

export default function AuthFormJWT({ onAuthChange }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  useEffect(() => {
    // Get return URL from query params or store current URL
    const returnTo = searchParams.get('returnTo')
    if (returnTo) {
      setReturnUrl(returnTo)
    } else if (typeof window !== 'undefined') {
      // Store the referring page if not on signin page
      const referrer = document.referrer
      const currentPath = window.location.pathname
      if (currentPath !== '/signin' && currentPath !== '/signup') {
        setReturnUrl(currentPath)
      } else if (referrer && !referrer.includes('/signin') && !referrer.includes('/signup')) {
        const url = new URL(referrer)
        setReturnUrl(url.pathname)
      }
    }
  }, [searchParams])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        // Register new user
        const result = await authAPI.register({
          email,
          password,
          username: username || undefined,
          firstname: firstname || undefined,
          lastname: lastname || undefined
        })

        if (result.success) {
          setMessage(result.message || 'Registration successful! Please login.')
          // Clear form and switch to login
          setTimeout(() => {
            setIsSignUp(false)
            setPassword('')
            setFirstname('')
            setLastname('')
            setUsername('')
          }, 2000)
        } else {
          setMessage(`Error: ${result.error}`)
        }
      } else {
        // Login user
        const result = await authAPI.login({
          email,
          password
        })

        if (result.success && result.user) {
          setMessage(result.message || 'Successfully signed in!')
          
          if (onAuthChange) {
            onAuthChange(result.user)
          }

          // Redirect to return URL or based on user role
          setTimeout(() => {
            if (returnUrl && returnUrl !== '/signin' && returnUrl !== '/signup') {
              router.push(returnUrl)
            } else {
              // Default redirect based on user role
              switch (result.user.role) {
                case 'admin':
                  router.push('/admin')
                  break
                case 'host':
                  router.push('/auctions')
                  break
                default:
                  router.push('/tournaments')
              }
            }
          }, 1000)
        } else {
          setMessage(`Error: ${result.error}`)
        }
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await authAPI.logout()
      setMessage('Successfully signed out')
      
      if (onAuthChange) {
        onAuthChange(null)
      }
      
      // Redirect to home
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Check if user is already logged in
  const currentUser = authAPI.getCurrentUser()
  
  if (currentUser) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <p className="text-gray-700">
              Logged in as: <strong>{currentUser.email}</strong>
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Role: <span className="font-medium">{currentUser.role}</span>
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleAuth} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        {/* Email Field */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Password Field */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Sign Up Fields */}
        {isSignUp && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Username (optional)
              </label>
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstname">
                First Name (optional)
              </label>
              <input
                id="firstname"
                type="text"
                placeholder="John"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastname">
                Last Name (optional)
              </label>
              <input
                id="lastname"
                type="text"
                placeholder="Doe"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="mb-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </div>

        {/* Toggle between Sign In and Sign Up */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage('')
            }}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"
            }
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded text-sm ${
            message.startsWith('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}
