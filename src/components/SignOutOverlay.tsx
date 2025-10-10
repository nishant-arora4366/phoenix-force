'use client'

import { createPortal } from 'react-dom'
import { useAuth } from '@/src/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function SignOutOverlay() {
  const { isSigningOut } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isSigningOut || !isMounted || typeof window === 'undefined') {
    return null
  }

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #19171b 0%, #2b0307 50%, #51080d 100%)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'all',
        overflow: 'hidden'
      }}
    >
      {/* Background patterns */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 1px 1px, rgba(117, 2, 15, 0.1) 1px, transparent 0)',
        backgroundSize: '20px 20px',
        opacity: 0.3
      }}></div>
      
      {/* Content */}
      <div 
        style={{
          backgroundColor: 'rgba(9, 23, 31, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(206, 161, 122, 0.2)',
          borderRadius: '0.75rem',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'fadeIn 0.3s ease-in-out',
          position: 'relative',
          zIndex: 2147483647,
          minWidth: '300px'
        }}
      >
        <div 
          style={{
            width: '3rem',
            height: '3rem',
            border: '2px solid rgba(206, 161, 122, 0.3)',
            borderTopColor: '#CEA17A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}
        ></div>
        <h2 style={{ 
          color: '#DBD0C0', 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem',
          letterSpacing: '0.025em'
        }}>
          Signing out...
        </h2>
        <p style={{ 
          color: '#CEA17A', 
          fontSize: '0.875rem',
          fontWeight: '400'
        }}>
          Returning to home page
        </p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  )
}

