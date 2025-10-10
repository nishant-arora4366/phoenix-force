'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { secureSessionManager } from '@/src/lib/secure-session'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: any
  isSigningOut: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentUser = secureSessionManager.getUser()
    setUser(currentUser)

    const unsubscribe = secureSessionManager.subscribe((sessionUser) => {
      // Don't update user during sign-out to prevent flashes
      if (!isSigningOut) {
        setUser(sessionUser)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isSigningOut])

  const signOut = () => {
    setIsSigningOut(true)
    
    // Prevent body scroll during sign-out
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
    
    try {
      // Clear session
      secureSessionManager.clearUser()
      setUser(null)
      
      // Navigate to home
      router.push('/')
      
      // Keep overlay visible for 2 seconds to cover any flashes
      setTimeout(() => {
        setIsSigningOut(false)
        if (typeof document !== 'undefined') {
          document.body.style.overflow = 'unset'
        }
      }, 2000)
    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false)
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset'
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isSigningOut, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

