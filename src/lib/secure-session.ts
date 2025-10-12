// Secure JWT-based session management
import { setSupabaseAuth } from './supabaseClient'

export interface SessionUser {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
  status: string
}

class SecureSessionManager {
  private static instance: SecureSessionManager
  private currentUser: SessionUser | null = null
  private currentToken: string | null = null
  private listeners: ((user: SessionUser | null) => void)[] = []
  private expirationCheckInterval: NodeJS.Timeout | null = null

  static getInstance(): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      SecureSessionManager.instance = new SecureSessionManager()
    }
    return SecureSessionManager.instance
  }

  // Set current user and token (called after successful login)
  setUser(user: SessionUser | null, token?: string) {
    this.currentUser = user
    this.currentToken = token || null
    this.notifyListeners()
    
    // Store in localStorage for persistence (token is secure, user data is just for UI)
    if (typeof window !== 'undefined') {
      if (user && token) {
        localStorage.setItem('phoenix_token', token)
        localStorage.setItem('phoenix_user', JSON.stringify(user))
        // Sync JWT with Supabase for realtime subscriptions
        setSupabaseAuth(token)
      } else {
        localStorage.removeItem('phoenix_token')
        localStorage.removeItem('phoenix_user')
        // Clear Supabase auth
        setSupabaseAuth(null)
      }
    }
  }

  // Get current user (for UI purposes only)
  getUser(): SessionUser | null {
    if (!this.currentUser) {
      // Try to restore from localStorage (only in browser)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('phoenix_user')
        const storedToken = localStorage.getItem('phoenix_token')
        
        if (stored && storedToken) {
          try {
            this.currentUser = JSON.parse(stored)
            this.currentToken = storedToken
            // Sync restored JWT with Supabase for realtime
            setSupabaseAuth(storedToken)
          } catch (error) {
            // Error parsing stored user
            this.clearUser()
          }
        }
      }
    }
    return this.currentUser
  }

  // Get current token (for API requests)
  getToken(): string | null {
    if (!this.currentToken && typeof window !== 'undefined') {
      this.currentToken = localStorage.getItem('phoenix_token')
      // Sync restored token with Supabase for realtime
      if (this.currentToken) {
        setSupabaseAuth(this.currentToken)
      }
    }
    return this.currentToken
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken()
    if (!token) return true

    try {
      // Decode token without verification (just to read expiration)
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const decoded = JSON.parse(jsonPayload)
      
      if (!decoded.exp) {
        // Token has no expiration
        return true
      }
      
      const currentTime = Math.floor(Date.now() / 1000)
      const isExpired = decoded.exp < currentTime
      
      if (isExpired) {
      }
      
      return isExpired
    } catch (error) {
      // Error checking token expiration
      return true
    }
  }

  // Get time until token expires (in milliseconds)
  getTimeUntilExpiration(): number {
    const token = this.getToken()
    if (!token) return 0

    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const decoded = JSON.parse(jsonPayload)
      
      if (!decoded.exp) return 0
      
      const currentTime = Math.floor(Date.now() / 1000)
      const timeUntilExpiration = (decoded.exp - currentTime) * 1000 // Convert to milliseconds
      return Math.max(0, timeUntilExpiration)
    } catch (error) {
      // Error getting token expiration time
      return 0
    }
  }

  // Start monitoring token expiration
  startExpirationMonitoring(onExpired: () => void, onWarning?: (minutesLeft: number) => void, skipInitialWarning: boolean = false) {
    
    // Clear any existing interval
    this.stopExpirationMonitoring()

    // Check immediately if token is already expired
    if (this.isTokenExpired()) {
      onExpired()
      return
    }

    // Log initial time remaining
    const initialTimeLeft = this.getTimeUntilExpiration()
    const initialMinutesLeft = Math.floor(initialTimeLeft / 60000)
    const initialSecondsLeft = Math.floor(initialTimeLeft / 1000)
    
    // Also log the actual token expiration time for debugging
    const token = this.getToken()
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const decoded = JSON.parse(jsonPayload)
        const expDate = new Date(decoded.exp * 1000)
        const iatDate = new Date(decoded.iat * 1000)
        // Token debug info removed
      } catch (e) {
        // Error parsing token for debug
      }
    }
    

    let warningShown = false

    // Show warning immediately if less than 5 minutes remaining (unless skipping)
    if (onWarning && initialMinutesLeft <= 5 && !skipInitialWarning) {
      const displayMinutes = Math.max(1, initialMinutesLeft) // Show at least "1 minute" even if < 60 seconds
      warningShown = true
      onWarning(displayMinutes)
    }

    // If less than 1 minute, check every 5 seconds for more responsive sign-out
    const checkInterval = initialSecondsLeft < 60 ? 5000 : 30000

    // Check periodically
    this.expirationCheckInterval = setInterval(() => {
      const timeLeft = this.getTimeUntilExpiration()
      const minutesLeft = Math.floor(timeLeft / 60000)
      const secondsLeft = Math.floor(timeLeft / 1000)
      
      if (this.isTokenExpired()) {
        this.stopExpirationMonitoring()
        onExpired()
        return
      }

      // Show warning if less than 5 minutes remaining
      if (onWarning && !warningShown) {
        if (minutesLeft <= 5 && minutesLeft > 0) {
          warningShown = true
          onWarning(minutesLeft)
        }
      }
    }, checkInterval)
  }

  // Stop monitoring token expiration
  stopExpirationMonitoring() {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval)
      this.expirationCheckInterval = null
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken()
    const user = this.getUser()
    return !!(token && user)
  }

  // Refresh user data from server (validates token)
  async refreshUser(): Promise<SessionUser | null> {
    const token = this.getToken()
    if (!token) return null

    try {
      const response = await fetch('/api/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        const updatedUser = result.data
        this.setUser(updatedUser, token)
        return updatedUser
      } else {
        // Token is invalid, clear session
        this.clearUser()
        return null
      }
    } catch (error) {
      // Error refreshing user data
      this.clearUser()
      return null
    }
  }

  // Refresh JWT token (extend session)
  async refreshToken(): Promise<boolean> {
    const token = this.getToken()
    const user = this.getUser()
    
    if (!token || !user) {
      // Cannot refresh: no token or user
      return false
    }

    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.token) {
        // Update with new token
        this.setUser(result.user, result.token)
        return true
      } else {
        // Token refresh failed
        return false
      }
    } catch (error) {
      // Error refreshing token
      return false
    }
  }

  // Clear user and token (called on logout)
  clearUser() {
    this.currentUser = null
    this.currentToken = null
    this.stopExpirationMonitoring()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phoenix_token')
      localStorage.removeItem('phoenix_user')
      // Clear Supabase auth
      setSupabaseAuth(null)
    }
    this.notifyListeners()
  }

  // Subscribe to user changes
  subscribe(listener: (user: SessionUser | null) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser))
  }

  // Create authorization header for API requests
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const secureSessionManager = SecureSessionManager.getInstance()
