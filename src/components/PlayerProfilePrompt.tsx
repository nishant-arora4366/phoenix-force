'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PlayerProfilePromptProps {
  onClose: () => void
  returnUrl?: string
}

export default function PlayerProfilePrompt({ onClose, returnUrl = '/' }: PlayerProfilePromptProps) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#09171F] via-[#3E4E5A] to-[#09171F] rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 scale-100 border border-[#CEA17A]/30 animate-slide-up">
        {/* Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#09171F]/60 via-transparent to-[#3E4E5A]/30 rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-2xl"></div>
        
        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 animate-fade-in-up delay-100">
            <h3 className="text-2xl font-bold text-white mb-2">
              Player Profile Required
            </h3>
            <p className="text-[#CEA17A] text-sm">Join tournaments and auctions</p>
          </div>
          
          {/* Description */}
          <div className="mb-8 animate-fade-in-up delay-200">
            <p className="text-white leading-relaxed text-center text-base">
              To participate in tournaments and auctions, you need to create a player profile with your skills, ratings, and preferences. This helps organizers and other players understand your playing style and abilities.
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3 animate-fade-in-up delay-300">
            <Link
              href={`/player-profile?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#CEA17A] hover:bg-[#CEA17A]/80 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#CEA17A]/20 focus:ring-offset-2 focus:ring-offset-transparent animate-pulse-glow"
            >
              <span>Create Player Profile →</span>
            </Link>
            <button
              onClick={() => {
                onClose()
                // Just close the dialog without navigation to preserve scroll position
              }}
              className="group relative inline-flex items-center justify-center px-8 py-3 bg-[#3E4E5A] hover:bg-[#3E4E5A]/80 text-[#CEA17A] hover:text-white border border-[#CEA17A]/30 hover:border-[#CEA17A]/50 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#CEA17A]/20 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <span>Will Create Later</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
