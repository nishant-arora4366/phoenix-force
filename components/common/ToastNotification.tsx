import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning' | 'player-sold'
  title: string
  message?: string
  duration?: number
  playerData?: {
    playerName: string
    amount: number
    teamName: string
    playerImage?: string
  }
}

interface ToastNotificationProps {
  toast: Toast
  onClose: (id: string) => void
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto close
    const duration = toast.duration || (toast.type === 'player-sold' ? 5000 : 3000)
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [toast])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(toast.id), 300)
  }

  const getToastStyles = () => {
    const baseStyles = 'relative overflow-hidden rounded-xl shadow-2xl border backdrop-blur-sm transition-all duration-300 transform'
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-900/90 border-green-500/50 text-green-100`
      case 'error':
        return `${baseStyles} bg-red-900/90 border-red-500/50 text-red-100`
      case 'warning':
        return `${baseStyles} bg-yellow-900/90 border-yellow-500/50 text-yellow-100`
      case 'info':
        return `${baseStyles} bg-blue-900/90 border-blue-500/50 text-blue-100`
      case 'player-sold':
        return `${baseStyles} bg-gradient-to-br from-[#2A1810] via-[#3E2418] to-[#2A1810] border-[#CEA17A]/60 text-[#DBD0C0]`
      default:
        return `${baseStyles} bg-gray-900/90 border-gray-500/50 text-gray-100`
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      case 'player-sold':
        return '🔨'
      default:
        return ''
    }
  }

  if (toast.type === 'player-sold' && toast.playerData) {
    return (
      <div
        className={`
          ${getToastStyles()}
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${isLeaving ? 'translate-x-full opacity-0' : ''}
          min-w-[320px] max-w-md
        `}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#CEA17A]/20 to-transparent animate-pulse" />
        
        {/* Content */}
        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">{getIcon()}</span>
              <h3 className="text-lg font-bold text-[#CEA17A]">PLAYER SOLD!</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-[#DBD0C0]/60 hover:text-[#DBD0C0] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Player Details */}
          <div className="flex items-center gap-4">
            {toast.playerData.playerImage && (
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[#CEA17A]/40">
                <img
                  src={toast.playerData.playerImage}
                  alt={toast.playerData.playerName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            
            <div className="flex-1">
              <p className="text-xl font-bold text-[#DBD0C0] mb-1">
                {toast.playerData.playerName}
              </p>
              <p className="text-sm text-[#CEA17A]/80 mb-1">
                Sold to <span className="font-bold text-[#CEA17A]">{toast.playerData.teamName}</span>
              </p>
              <p className="text-2xl font-bold text-[#CEA17A]">
                ₹{toast.playerData.amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Celebration animation */}
          <div className="absolute -top-2 -right-2 text-4xl animate-spin-slow opacity-20">
            ⭐
          </div>
        </div>
      </div>
    )
  }

  // Regular toast notification
  return (
    <div
      className={`
        ${getToastStyles()}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'translate-x-full opacity-0' : ''}
        min-w-[280px] max-w-sm p-4
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{getIcon()}</span>
        <div className="flex-1">
          <h4 className="font-semibold">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm mt-1 opacity-90">{toast.message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-white/60 hover:text-white transition-colors ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Toast Container Component
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    // Listen for custom toast events
    const handleToast = (event: CustomEvent<Toast>) => {
      setToasts(prev => [...prev, event.detail])
    }

    window.addEventListener('show-toast' as any, handleToast)
    return () => window.removeEventListener('show-toast' as any, handleToast)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onClose={removeToast}
        />
      ))}
    </div>,
    document.body
  )
}

// Helper function to show toast
export const showToast = (toast: Omit<Toast, 'id'>) => {
  const event = new CustomEvent('show-toast', {
    detail: {
      ...toast,
      id: Math.random().toString(36).substr(2, 9)
    }
  })
  window.dispatchEvent(event)
}

// Specialized function for player sold notifications
export const showPlayerSoldNotification = (
  playerName: string,
  amount: number,
  teamName: string,
  playerImage?: string
) => {
  showToast({
    type: 'player-sold',
    title: 'Player Sold!',
    playerData: {
      playerName,
      amount,
      teamName,
      playerImage
    },
    duration: 5000
  })
}
