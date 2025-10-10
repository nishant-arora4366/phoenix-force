'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { secureSessionManager } from '@/src/lib/secure-session'

interface FormErrors {
  firstname?: string
  lastname?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function SignUpContent() {
  const [user, setUser] = useState<any>(null)
  const [firstname, setFirstname] = useState('')
  const [middlename, setMiddlename] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
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

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password validation
  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const newErrors: FormErrors = { ...errors }

    switch (field) {
      case 'firstname':
        if (!value.trim()) {
          newErrors.firstname = 'First name is required'
        } else {
          delete newErrors.firstname
        }
        break
      case 'lastname':
        if (!value.trim()) {
          newErrors.lastname = 'Last name is required'
        } else {
          delete newErrors.lastname
        }
        break
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required'
        } else if (!validateEmail(value)) {
          newErrors.email = 'Please enter a valid email address'
        } else {
          delete newErrors.email
        }
        break
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required'
        } else if (!validatePassword(value)) {
          newErrors.password = 'Password must be at least 6 characters long'
        } else {
          delete newErrors.password
        }
        // Also check confirm password if it's filled
        if (confirmPassword && value !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match'
        } else if (confirmPassword && value === confirmPassword) {
          delete newErrors.confirmPassword
        }
        break
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password'
        } else if (value !== password) {
          newErrors.confirmPassword = 'Passwords do not match'
        } else {
          delete newErrors.confirmPassword
        }
        break
    }

    setErrors(newErrors)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate all fields
    const newErrors: FormErrors = {}

    if (!firstname.trim()) {
      newErrors.firstname = 'First name is required'
    }
    if (!lastname.trim()) {
      newErrors.lastname = 'Last name is required'
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters long'
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      setMessage('Please fix the errors below')
      return
    }

    try {
      // Use custom registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username: email.split('@')[0], // Auto-generate username from email
          firstname,
          middlename: middlename || undefined,
          lastname
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Registration failed')
      }
      
      // Show success modal
      setShowSuccessModal(true)
      
      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        router.push('/signin')
      }, 3000)
    } catch (error: any) {
      setMessage(error.message || 'An error occurred during registration')
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
                Join Phoenix Force
              </h1>
              <p className="text-[#CEA17A]">
                Create your account to get started
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-5">
              {/* First Name */}
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstname"
                  type="text"
                  value={firstname}
                  onChange={(e) => {
                    setFirstname(e.target.value)
                    validateField('firstname', e.target.value)
                  }}
                  onBlur={(e) => validateField('firstname', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60 ${
                    errors.firstname ? 'border-red-500' : 'border-[#CEA17A]/25'
                  }`}
                  placeholder="First name"
                />
                {errors.firstname && (
                  <p className="mt-1 text-sm text-red-500">{errors.firstname}</p>
                )}
              </div>

              {/* Middle Name */}
              <div>
                <label htmlFor="middlename" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Middle Name
                </label>
                <input
                  id="middlename"
                  type="text"
                  value={middlename}
                  onChange={(e) => setMiddlename(e.target.value)}
                  className="w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  placeholder="Middle name (optional)"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastname"
                  type="text"
                  value={lastname}
                  onChange={(e) => {
                    setLastname(e.target.value)
                    validateField('lastname', e.target.value)
                  }}
                  onBlur={(e) => validateField('lastname', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60 ${
                    errors.lastname ? 'border-red-500' : 'border-[#CEA17A]/25'
                  }`}
                  placeholder="Put LNU in case no last name"
                />
                {errors.lastname && (
                  <p className="mt-1 text-sm text-red-500">{errors.lastname}</p>
                )}
              </div>
              
              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    validateField('email', e.target.value)
                  }}
                  onBlur={(e) => validateField('email', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60 ${
                    errors.email ? 'border-red-500' : 'border-[#CEA17A]/25'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    validateField('password', e.target.value)
                  }}
                  onBlur={(e) => validateField('password', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60 ${
                    errors.password ? 'border-red-500' : 'border-[#CEA17A]/25'
                  }`}
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#DBD0C0] mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    validateField('confirmPassword', e.target.value)
                  }}
                  onBlur={(e) => validateField('confirmPassword', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-[#CEA17A]/25'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
              
              {message && (
                <div className="p-4 rounded-lg text-sm bg-[#75020f]/15 text-[#75020f] border border-[#75020f]/25">
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#09171F] to-[#1a2332] border border-[#CEA17A]/30 rounded-xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#3E4E5A]/25 rounded-full flex items-center justify-center border-2 border-[#CEA17A]/40">
                <svg className="w-10 h-10 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            {/* Success Message */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#CEA17A] mb-3">
                Registration Successful!
              </h3>
              <p className="text-[#DBD0C0] text-base mb-2">
                Your account has been created successfully.
              </p>
              <p className="text-[#CEA17A]/80 text-sm">
                Your account is pending admin approval. You will receive a notification once approved.
              </p>
            </div>

            {/* Redirect Info */}
            <div className="mt-6 p-4 bg-[#3E4E5A]/15 border border-[#CEA17A]/25 rounded-lg">
              <p className="text-[#DBD0C0] text-sm text-center">
                Redirecting to sign in page in a moment...
              </p>
            </div>

            {/* Loading indicator */}
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CEA17A]"></div>
            </div>
          </div>
        </div>
      )}
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

