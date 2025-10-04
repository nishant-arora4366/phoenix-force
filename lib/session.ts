// Simple session management for custom authentication

export interface SessionUser {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
  status: string
}

class SessionManager {
  private static instance: SessionManager
  private currentUser: SessionUser | null = null
  private listeners: ((user: SessionUser | null) => void)[] = []

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Set current user (called after successful login)
  setUser(user: SessionUser | null) {
    this.currentUser = user
    this.notifyListeners()
    
    // Store in localStorage for persistence
    if (user) {
      localStorage.setItem('phoenix_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('phoenix_user')
    }
  }

  // Get current user
  getUser(): SessionUser | null {
    if (!this.currentUser) {
      // Try to restore from localStorage
      const stored = localStorage.getItem('phoenix_user')
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored)
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('phoenix_user')
        }
      }
    }
    return this.currentUser
  }

  // Refresh user data from database
  async refreshUser(): Promise<SessionUser | null> {
    if (!this.currentUser) return null

    try {
      const response = await fetch(`/api/user-profile?userId=${this.currentUser.id}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const updatedUser = result.data
        this.setUser(updatedUser)
        return updatedUser
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
    
    return this.currentUser
  }

  // Clear user (called on logout)
  clearUser() {
    this.currentUser = null
    localStorage.removeItem('phoenix_user')
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
}

export const sessionManager = SessionManager.getInstance()
