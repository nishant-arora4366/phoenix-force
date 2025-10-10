'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { secureSessionManager } from '@/src/lib/secure-session'

interface UserProfile {
  username: string
  firstname: string
  middlename?: string
  lastname: string
  photo?: string
}

function SignUpContent() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    firstname: '',
    middlename: '',
    lastname: '',
    photo: ''
  })
  const router = useRouter()

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validate required fields for signup
      if (!profile.firstname.trim() || !profile.lastname.trim()) {
        throw new Error('First name and last name are required')
      }

      // Use custom registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username: profile.username || email.split('@')[0],
          firstname: profile.firstname,
          lastname: profile.lastname
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }
      
      setMessage('Registration successful! Your account is pending admin approval.')
      
      // Redirect to sign in page after successful registration
      setTimeout(() => {
        router.push('/signin')
      }, 2000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
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
                Join Phoenix Force
              </h1>
              <p className="text-[#CEA17A]">
                Create your account to get started
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-6">
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
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleProfileChange('username', e.target.value)}
                  className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  placeholder="Choose a username (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstname" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                    First Name
                  </label>
                  <input
                    id="firstname"
                    type="text"
                    value={profile.firstname}
                    onChange={(e) => handleProfileChange('firstname', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label htmlFor="lastname" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastname"
                    type="text"
                    value={profile.lastname}
                    onChange={(e) => handleProfileChange('lastname', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="middlename" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Middle Name
                </label>
                <input
                  id="middlename"
                  type="text"
                  value={profile.middlename}
                  onChange={(e) => handleProfileChange('middlename', e.target.value)}
                  className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  placeholder="Middle name (optional)"
                />
              </div>

              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Photo URL
                </label>
                <input
                  id="photo"
                  type="url"
                  value={profile.photo}
                  onChange={(e) => handleProfileChange('photo', e.target.value)}
                  className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  placeholder="Profile photo URL (optional)"
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-[#CEA17A] text-sm">
                Already have an account?{' '}
                <Link
                  href="/signin"
                  className="font-medium text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-200"
                >
                  Sign in here
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

export default function SignUp() {
  return (
    <Suspense fallback={
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
    }>
      <SignUpContent />
    </Suspense>
  )
}

