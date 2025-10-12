'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { secureSessionManager } from '@/src/lib/secure-session'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: any
  isSigningOut: boolean
  expirationWarning: string | null
  isRefreshingToken: boolean
  signOut: () => void
  extendSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [expirationWarning, setExpirationWarning] = useState<string | null>(null)
  const [isRefreshingToken, setIsRefreshingToken] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Track if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true)
  }, [])

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
        // Clear any remaining warnings after sign-out
        setExpirationWarning(null)
        if (typeof document !== 'undefined') {
          document.body.style.overflow = 'unset'
        }
      }, 2000)
    } catch (error) {
      setIsSigningOut(false)
      setExpirationWarning(null) // Clear warning on error too
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset'
      }
    }
  }

  const extendSession = async () => {
    setIsRefreshingToken(true)

    try {
      const success = await secureSessionManager.refreshToken()

      if (success) {
        // Show success message briefly, then clear warning
        setExpirationWarning('Session extended successfully!')
        setTimeout(() => {
          setExpirationWarning(null)
        }, 2000)

        // Restart monitoring with new token
        secureSessionManager.startExpirationMonitoring(
          () => {
            signOut()
          },
          (minutesLeft) => {
            setExpirationWarning(`Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work.`)
          },
          true // Skip initial warning since we just extended
        )
      } else {
        setExpirationWarning('Failed to extend session. Please save your work.')
      }
    } catch (error) {
      setExpirationWarning('Failed to extend session. Please save your work.')
    } finally {
      setIsRefreshingToken(false)
    }
  }

  useEffect(() => {
    const currentUser = secureSessionManager.getUser()
    setUser(currentUser)

    // Start monitoring token expiration if user is logged in
    if (currentUser) {
      secureSessionManager.startExpirationMonitoring(
        () => {
          signOut()
        },
        (minutesLeft) => {
          setExpirationWarning(`Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work.`)
        }
      )
    }

    const unsubscribe = secureSessionManager.subscribe((sessionUser) => {
      // Don't update user during sign-out to prevent flashes
      if (!isSigningOut) {
        setUser(sessionUser)
        
        // Start or stop expiration monitoring based on user state
        if (sessionUser) {
          secureSessionManager.startExpirationMonitoring(
            () => {
              signOut()
            },
            (minutesLeft) => {
              setExpirationWarning(`Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work.`)
            }
          )
        } else {
          // Only stop monitoring if not signing out due to expiration
          // (Keep warning visible during expiration sign-out)
          if (!expirationWarning) {
            secureSessionManager.stopExpirationMonitoring()
          }
        }
      }
    })

    return () => {
      unsubscribe()
      secureSessionManager.stopExpirationMonitoring()
    }
  }, [])

  // Monitor warning state changes
  useEffect(() => {
    // Warning state changed
  }, [expirationWarning])

  return (
    <AuthContext.Provider value={{ user, isSigningOut, expirationWarning, isRefreshingToken, signOut, extendSession }}>
      {children}
      {expirationWarning && isMounted && typeof window !== 'undefined' && (() => {
        const messageLower = expirationWarning.toLowerCase()
        const variant = messageLower.includes('success')
          ? 'success'
          : messageLower.includes('fail') || messageLower.includes('error')
          ? 'error'
          : 'warning'

        const tone = variant === 'success'
          ? {
              title: 'Session extended',
              background: 'linear-gradient(145deg, rgba(15, 118, 110, 0.25), rgba(15, 23, 42, 0.75))',
              borderColor: 'rgba(45, 212, 191, 0.35)',
              accentGradient: 'linear-gradient(90deg, rgba(16, 185, 129, 0.85), rgba(45, 212, 191, 0.85))',
              iconBackground: 'rgba(45, 212, 191, 0.18)',
              iconColor: '#a5f3fc',
              primaryBg: '#22c55e',
              primaryHover: '#16a34a',
              primaryText: '#052e16',
              secondaryBg: 'rgba(30, 41, 59, 0.65)',
              secondaryHover: 'rgba(30, 41, 59, 0.82)',
              secondaryText: '#e2e8f0',
              closeColor: '#99f6e4',
              icon: (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )
            }
          : variant === 'error'
          ? {
              title: 'Session issue',
              background: 'linear-gradient(145deg, rgba(30, 64, 175, 0.2), rgba(30, 41, 59, 0.82))',
              borderColor: 'rgba(96, 165, 250, 0.45)',
              accentGradient: 'linear-gradient(90deg, rgba(14, 165, 233, 0.9), rgba(59, 130, 246, 0.9))',
              iconBackground: 'rgba(59, 130, 246, 0.18)',
              iconColor: '#bfdbfe',
              primaryBg: '#22c55e',
              primaryHover: '#16a34a',
              primaryText: '#052e16',
              secondaryBg: 'rgba(15, 23, 42, 0.78)',
              secondaryHover: 'rgba(30, 41, 59, 0.9)',
              secondaryText: '#e2e8f0',
              closeColor: '#bfdbfe',
              icon: (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.121-11.879a1 1 0 10-1.414-1.414L10 7.414 9.293 6.707a1 1 0 00-1.414 1.414L8.586 8.83l-.707.707a1 1 0 001.414 1.414L10 10.243l.707.708a1 1 0 001.414-1.414l-.707-.707.707-.707z" clipRule="evenodd" />
                </svg>
              )
            }
          : {
              title: 'Session expiring soon',
              background: 'linear-gradient(145deg, rgba(30, 64, 175, 0.12), rgba(15, 23, 42, 0.85))',
              borderColor: 'rgba(148, 163, 184, 0.35)',
              accentGradient: 'linear-gradient(90deg, rgba(56, 189, 248, 0.85), rgba(59, 130, 246, 0.85))',
              iconBackground: 'rgba(59, 130, 246, 0.16)',
              iconColor: '#c7d2fe',
              primaryBg: '#22c55e',
              primaryHover: '#16a34a',
              primaryText: '#052e16',
              secondaryBg: 'rgba(15, 23, 42, 0.7)',
              secondaryHover: 'rgba(30, 41, 59, 0.82)',
              secondaryText: '#e2e8f0',
              closeColor: '#c7d2fe',
              icon: (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )
            }

        const showPrimaryAction = variant !== 'success'
        const primaryLabel = isRefreshingToken ? 'Extending…' : variant === 'error' ? 'Try Again' : 'Stay Logged In'

        const containerStyle: React.CSSProperties = {
          position: 'fixed',
          top: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0 24px',
          pointerEvents: 'none',
          zIndex: 2147483647
        }

        const panelStyle: React.CSSProperties = {
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: 360
        }

        const cardStyle: React.CSSProperties = {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 18,
          border: `1px solid ${tone.borderColor}`,
          background: tone.background,
          color: '#f8fafc',
          boxShadow: '0 25px 65px -18px rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)'
        }

        const accentStyle: React.CSSProperties = {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundImage: tone.accentGradient
        }

        const contentStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: '22px 24px 20px 24px'
        }

        const iconStyle: React.CSSProperties = {
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: 14,
          background: tone.iconBackground,
          color: tone.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }

        const titleStyle: React.CSSProperties = {
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: 'uppercase'
        }

        const messageStyle: React.CSSProperties = {
          marginTop: 6,
          fontSize: 14,
          lineHeight: 1.6,
          color: 'rgba(226, 232, 240, 0.95)'
        }

        const actionsStyle: React.CSSProperties = {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 18
        }

        const buttonBase: React.CSSProperties = {
          borderRadius: 9999,
          padding: '10px 18px',
          fontSize: 14,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          minWidth: 160
        }

        const primaryButtonStyle: React.CSSProperties = {
          ...buttonBase,
          background: tone.primaryBg,
          color: tone.primaryText,
          boxShadow: '0 10px 30px -12px rgba(15, 118, 110, 0.65)'
        }

        const secondaryButtonStyle: React.CSSProperties = {
          ...buttonBase,
          background: tone.secondaryBg,
          color: tone.secondaryText,
          border: `1px solid rgba(248, 250, 252, 0.18)`
        }

        const closeButtonStyle: React.CSSProperties = {
          border: 'none',
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          color: 'rgba(203, 213, 225, 0.9)',
          cursor: 'pointer',
          transition: 'color 0.2s ease'
        }

        const handlePrimaryHover = (event: React.MouseEvent<HTMLButtonElement>, entering: boolean) => {
          event.currentTarget.style.background = entering ? tone.primaryHover : tone.primaryBg
        }

        const handleSecondaryHover = (event: React.MouseEvent<HTMLButtonElement>, entering: boolean) => {
          event.currentTarget.style.background = entering ? tone.secondaryHover : tone.secondaryBg
        }

        const handleCloseHover = (event: React.MouseEvent<HTMLButtonElement>, entering: boolean) => {
          event.currentTarget.style.color = entering ? tone.closeColor : 'rgba(203, 213, 225, 0.9)'
        }

        return createPortal(
          <div style={containerStyle} data-testid="expiration-warning">
            <div style={panelStyle}>
              <div style={cardStyle} role="alert" aria-live="assertive">
                <div style={accentStyle}></div>
                <div style={contentStyle}>
                  <div style={iconStyle}>{tone.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={titleStyle}>{tone.title}</p>
                    <p style={messageStyle}>{expirationWarning}</p>
                    <div style={actionsStyle}>
                      {showPrimaryAction && (
                        <button
                          onClick={extendSession}
                          disabled={isRefreshingToken}
                          style={{ ...primaryButtonStyle, opacity: isRefreshingToken ? 0.7 : 1, cursor: isRefreshingToken ? 'not-allowed' : 'pointer' }}
                          onMouseEnter={(event) => handlePrimaryHover(event, true)}
                          onMouseLeave={(event) => handlePrimaryHover(event, false)}
                        >
                          {primaryLabel}
                        </button>
                      )}
                      <button
                        onClick={() => setExpirationWarning(null)}
                        style={secondaryButtonStyle}
                        onMouseEnter={(event) => handleSecondaryHover(event, true)}
                        onMouseLeave={(event) => handleSecondaryHover(event, false)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpirationWarning(null)}
                    style={closeButtonStyle}
                    onMouseEnter={(event) => handleCloseHover(event, true)}
                    onMouseLeave={(event) => handleCloseHover(event, false)}
                    aria-label="Close session warning"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      })()}
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

