'use client'

import Link from 'next/link'

interface PlayerProfilePromptProps {
  onClose: () => void
}

export default function PlayerProfilePrompt({ onClose }: PlayerProfilePromptProps) {

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gray-600 rounded-t-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Player Profile Required
                </h3>
                <p className="text-gray-200 text-sm">Join tournaments and auctions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 leading-relaxed mb-4">
              To participate in tournaments and auctions, you need to create a player profile with your skills, ratings, and preferences. This helps organizers and other players understand your playing style and abilities.
            </p>
            
            {/* Benefits list */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h5 className="text-sm font-semibold text-gray-900 mb-3">What you'll get:</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Participate in tournaments and auctions
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Showcase your skills and ratings
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Connect with other players
                </li>
              </ul>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/player-profile"
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg text-center font-semibold hover:bg-gray-700 transition-colors"
            >
              Create Player Profile
            </Link>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-center font-medium hover:bg-gray-200 transition-colors border border-gray-200"
            >
              Maybe Later
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            You can create your player profile anytime from your profile page
          </p>
        </div>
      </div>
    </div>
  )
}
