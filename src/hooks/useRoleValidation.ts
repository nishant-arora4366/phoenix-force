import { useEffect, useState } from 'react'
import { roleValidator } from '@/src/lib/role-validator'
import { secureSessionManager } from '@/src/lib/secure-session'

/**
 * Hook to validate user role and handle role changes
 * @param intervalMs - Validation interval in milliseconds (default: 30 seconds)
 * @returns Object with validation state and user data
 */
export function useRoleValidation(intervalMs: number = 30000) {
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidation, setLastValidation] = useState<Date | null>(null)
  const [user, setUser] = useState(secureSessionManager.getUser())

  useEffect(() => {
    // Start role validation
    roleValidator.startValidation(intervalMs)
    setIsValidating(true)

    // Subscribe to validation events
    const unsubscribe = roleValidator.subscribe((isValid) => {
      setLastValidation(new Date())
      setIsValidating(false)
      
      if (!isValid) {
        // Role or status changed, update user data
        const currentUser = secureSessionManager.getUser()
        setUser(currentUser)
      }
    })

    // Subscribe to user changes
    const unsubscribeUser = secureSessionManager.subscribe((userData) => {
      setUser(userData)
    })

    return () => {
      roleValidator.stopValidation()
      unsubscribe()
      unsubscribeUser()
    }
  }, [intervalMs])

  return {
    isValidating,
    lastValidation,
    user,
    isAuthenticated: !!user
  }
}
