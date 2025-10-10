import { secureSessionManager } from './secure-session'

/**
 * Role validation service to check if user's role has changed
 */
class RoleValidator {
  private static instance: RoleValidator
  private validationInterval: NodeJS.Timeout | null = null
  private listeners: ((isValid: boolean) => void)[] = []

  static getInstance(): RoleValidator {
    if (!RoleValidator.instance) {
      RoleValidator.instance = new RoleValidator()
    }
    return RoleValidator.instance
  }

  /**
   * Start periodic role validation
   * @param intervalMs - Validation interval in milliseconds (default: 30 seconds)
   */
  startValidation(intervalMs: number = 30000) {
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
    }

    this.validationInterval = setInterval(async () => {
      await this.validateCurrentUser()
    }, intervalMs)

    // Also validate immediately
    this.validateCurrentUser()
  }

  /**
   * Stop role validation
   */
  stopValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
      this.validationInterval = null
    }
  }

  /**
   * Validate current user's role against database
   */
  async validateCurrentUser(): Promise<boolean> {
    const currentUser = secureSessionManager.getUser()
    const token = secureSessionManager.getToken()

    if (!currentUser || !token) {
      this.notifyListeners(false)
      return false
    }

    try {
      // Make authenticated request to validate user
      const response = await fetch('/api/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        // Token is invalid or user doesn't exist
        console.warn('Role validation failed: Invalid token or user not found', {
          status: response.status,
          statusText: response.statusText,
          userId: currentUser.id
        })
        secureSessionManager.clearUser()
        this.notifyListeners(false)
        return false
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        const dbUser = result.data
        
        // Check if role has changed
        if (dbUser.role !== currentUser.role) {
          const roleHierarchy = { 'viewer': 1, 'host': 2, 'admin': 3 }
          const tokenRoleLevel = roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 0
          const dbRoleLevel = roleHierarchy[dbUser.role as keyof typeof roleHierarchy] || 0
          
          if (dbRoleLevel < tokenRoleLevel) {
            // Role was downgraded - update user data but don't clear session
            console.warn('Role validation: Role downgraded', {
              tokenRole: currentUser.role,
              dbRole: dbUser.role,
              userId: currentUser.id
            })
            
            // Update user data with new role (don't clear session)
            secureSessionManager.setUser(dbUser, token)
            this.notifyListeners(false) // Role downgraded, refresh UI
            return false
          } else {
            // Role was upgraded - this is fine
            console.info('Role validation: Role upgraded', {
              tokenRole: currentUser.role,
              dbRole: dbUser.role,
              userId: currentUser.id
            })
            
            // Update user data with new role
            secureSessionManager.setUser(dbUser, token)
            this.notifyListeners(true) // Role upgraded, refresh UI
            return true
          }
        }

        // Check if user status has changed
        if (dbUser.status !== currentUser.status) {
          console.warn('Role validation failed: Status changed', {
            tokenStatus: currentUser.status,
            dbStatus: dbUser.status,
            userId: currentUser.id
          })
          
          // Update user data with new status
          secureSessionManager.setUser(dbUser, token)
          this.notifyListeners(false) // Status changed, may need to refresh UI
          return false
        }

        // User is valid, update with latest data
        secureSessionManager.setUser(dbUser, token)
        this.notifyListeners(true)
        return true
      } else {
        console.warn('Role validation failed: Invalid response')
        secureSessionManager.clearUser()
        this.notifyListeners(false)
        return false
      }
    } catch (error) {
      console.error('Role validation error:', error)
      // Don't clear user on network errors, just log
      return true
    }
  }

  /**
   * Subscribe to role validation events
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(listener: (isValid: boolean) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(isValid: boolean) {
    this.listeners.forEach(listener => listener(isValid))
  }
}

export const roleValidator = RoleValidator.getInstance()
