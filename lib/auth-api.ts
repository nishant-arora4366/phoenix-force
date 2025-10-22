/**
 * Unified JWT Authentication API
 * All authentication should go through these methods, not Supabase auth directly
 */

import { secureSessionManager } from '@/src/lib/secure-session'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  username?: string
  firstname?: string
  lastname?: string
  middlename?: string
}

interface AuthResponse {
  success: boolean
  user?: any
  token?: string
  message?: string
  error?: string
}

class AuthAPI {
  private static instance: AuthAPI
  
  static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI()
    }
    return AuthAPI.instance
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()
      
      if (data.success && data.user && data.token) {
        // Store user and token in secure session manager
        secureSessionManager.setUser(data.user, data.token)
        
        return {
          success: true,
          user: data.user,
          token: data.token,
          message: data.message || 'Login successful'
        }
      }

      return {
        success: false,
        error: data.error || 'Login failed'
      }
    } catch (error: any) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.message || 'Network error during login'
      }
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()
      
      if (data.success) {
        return {
          success: true,
          user: data.user,
          message: data.message || 'Registration successful. Please login.'
        }
      }

      return {
        success: false,
        error: data.error || 'Registration failed'
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: error.message || 'Network error during registration'
      }
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      const token = secureSessionManager.getToken()
      
      if (token) {
        // Notify server about logout (optional, for cleanup)
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {
          // Ignore logout API errors, proceed with local cleanup
        })
      }
    } finally {
      // Always clear local session
      secureSessionManager.clearUser()
    }
  }

  /**
   * Refresh the JWT token
   */
  async refreshToken(): Promise<boolean> {
    return secureSessionManager.refreshToken()
  }

  /**
   * Get the current authenticated user
   */
  getCurrentUser() {
    return secureSessionManager.getUser()
  }

  /**
   * Get the current JWT token
   */
  getToken() {
    return secureSessionManager.getToken()
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return secureSessionManager.isAuthenticated()
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    return secureSessionManager.getAuthHeader()
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    return secureSessionManager.isTokenExpired()
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    username?: string
    firstname?: string
    lastname?: string
  }): Promise<AuthResponse> {
    try {
      const token = this.getToken()
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated'
        }
      }

      const response = await fetch('/api/user-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      
      if (data.success && data.user) {
        // Update local user data
        secureSessionManager.setUser(data.user, token)
        
        return {
          success: true,
          user: data.user,
          message: 'Profile updated successfully'
        }
      }

      return {
        success: false,
        error: data.error || 'Failed to update profile'
      }
    } catch (error: any) {
      console.error('Update profile error:', error)
      return {
        success: false,
        error: error.message || 'Network error during profile update'
      }
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const token = this.getToken()
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated'
        }
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()
      
      return {
        success: data.success,
        message: data.success ? 'Password changed successfully' : undefined,
        error: data.error
      }
    } catch (error: any) {
      console.error('Change password error:', error)
      return {
        success: false,
        error: error.message || 'Network error during password change'
      }
    }
  }
}

export const authAPI = AuthAPI.getInstance()

// Export convenience functions
export const login = (credentials: LoginCredentials) => authAPI.login(credentials)
export const register = (userData: RegisterData) => authAPI.register(userData)
export const logout = () => authAPI.logout()
export const getCurrentUser = () => authAPI.getCurrentUser()
export const getAuthToken = () => authAPI.getToken()
export const isAuthenticated = () => authAPI.isAuthenticated()
