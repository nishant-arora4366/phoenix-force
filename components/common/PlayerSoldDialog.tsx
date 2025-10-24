'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface PlayerSoldData {
  playerName: string
  amount: number
  teamName: string
  playerImage?: string
}

interface PlayerSoldDialogProps {
  data: PlayerSoldData
  onClose: () => void
}

const PlayerSoldDialog: React.FC<PlayerSoldDialogProps> = ({ data, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto close after 1.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, 1500)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center p-4
        bg-black/70 backdrop-blur-sm
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onClose}
    >
      <div
        className={`
          relative bg-gradient-to-br from-[#2A1810] via-[#3E2418] to-[#2A1810]
          border-2 border-[#CEA17A]/60 rounded-2xl shadow-2xl
          transform transition-all duration-300
          ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
          max-w-md w-full mx-4
          overflow-hidden
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#CEA17A]/20 via-transparent to-[#CEA17A]/20 animate-pulse" />
        
        {/* Celebration stars */}
        <div className="absolute top-4 left-4 text-3xl animate-bounce opacity-60">💰</div>
        <div className="absolute top-4 right-4 text-3xl animate-bounce opacity-60" >💰</div>
        
        {/* Content */}
        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              {/* <span className="text-4xl animate-bounce">🔨</span> */}
              <h2 className="text-2xl sm:text-3xl font-bold text-[#CEA17A] tracking-wide">
                PLAYER SOLD!
              </h2>
            </div>
          </div>

          {/* Player Details */}
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Player Image */}
            {data.playerImage && (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#CEA17A]/60 shadow-lg">
                <img
                  src={data.playerImage}
                  alt={data.playerName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            
            {/* Player Name */}
            <div className="space-y-2">
              <p className="text-2xl sm:text-3xl font-bold text-[#DBD0C0]">
                {data.playerName}
              </p>
              
              {/* Team Name */}
              <p className="text-base sm:text-lg text-[#CEA17A]/90">
                Sold to <span className="font-bold text-[#CEA17A]">{data.teamName}</span>
              </p>
              
              {/* Amount */}
              <div className="mt-4 pt-4 border-t border-[#CEA17A]/30">
                <p className="text-sm text-[#DBD0C0]/70 mb-1">Selling Price</p>
                <p className="text-3xl sm:text-4xl font-bold text-[#CEA17A] tracking-tight">
                  ₹{data.amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Decorative bottom element */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent" />
        </div>
      </div>
    </div>
  )
}

// Dialog Container Component
export const PlayerSoldDialogContainer: React.FC = () => {
  const [dialogData, setDialogData] = useState<PlayerSoldData | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Listen for custom dialog events
    const handleDialog = (event: CustomEvent<PlayerSoldData>) => {
      setDialogData(event.detail)
    }

    window.addEventListener('show-player-sold-dialog' as any, handleDialog)
    return () => window.removeEventListener('show-player-sold-dialog' as any, handleDialog)
  }, [])

  const handleClose = () => {
    setDialogData(null)
  }

  if (!isMounted || !dialogData) return null

  return createPortal(
    <PlayerSoldDialog data={dialogData} onClose={handleClose} />,
    document.body
  )
}

// Helper function to show player sold dialog
export const showPlayerSoldDialog = (
  playerName: string,
  amount: number,
  teamName: string,
  playerImage?: string
) => {
  const event = new CustomEvent('show-player-sold-dialog', {
    detail: {
      playerName,
      amount,
      teamName,
      playerImage
    }
  })
  window.dispatchEvent(event)
}
