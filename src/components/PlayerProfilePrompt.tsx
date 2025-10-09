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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-br from-[#0a0a0a]/80 via-[#1a0000]/80 to-[#2a0000]/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-[#CEA17A]/20">
        
        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Player Profile Required
            </h3>
            <p className="text-[#CEA17A] text-sm">Join tournaments and auctions</p>
          </div>
          
          {/* Description */}
          <div className="mb-8">
            <p className="text-white leading-relaxed text-center text-base">
              To participate in tournaments and auctions, you need to create a player profile with your skills, ratings, and preferences. This helps organizers and other players understand your playing style and abilities.
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/player-profile?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#CEA17A]/20 backdrop-blur-sm hover:bg-[#CEA17A]/30 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#CEA17A]/20 focus:ring-offset-2 focus:ring-offset-transparent border border-[#CEA17A]/30 shadow-lg"
            >
              <span>Create Player Profile →</span>
            </Link>
            <button
              onClick={() => {
                onClose()
                // Just close the dialog without navigation to preserve scroll position
              }}
              className="group relative inline-flex items-center justify-center px-8 py-3 bg-transparent backdrop-blur-sm hover:bg-white/10 text-white border border-white/20 hover:border-white/40 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <span>Will Create Later</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
