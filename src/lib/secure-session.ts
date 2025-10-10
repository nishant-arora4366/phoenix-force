// Secure JWT-based session management

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
      } else {
        localStorage.removeItem('phoenix_token')
        localStorage.removeItem('phoenix_user')
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
          } catch (error) {
            console.error('Error parsing stored user:', error)
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
    }
    return this.currentToken
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
      console.error('Error refreshing user data:', error)
      this.clearUser()
      return null
    }
  }

  // Clear user and token (called on logout)
  clearUser() {
    this.currentUser = null
    this.currentToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phoenix_token')
      localStorage.removeItem('phoenix_user')
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
