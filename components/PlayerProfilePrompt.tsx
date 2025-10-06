'use client'

import Link from 'next/link'

interface PlayerProfilePromptProps {
  onClose: () => void
}

export default function PlayerProfilePrompt({ onClose }: PlayerProfilePromptProps) {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-t-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Complete Your Profile
                </h3>
                <p className="text-gray-200 text-sm">Join tournaments and auctions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Player Profile Required</h4>
                <p className="text-gray-600 leading-relaxed">
                  To participate in tournaments and auctions, you need to create a player profile with your skills, ratings, and preferences. This helps organizers and other players understand your playing style and abilities.
                </p>
              </div>
            </div>
            
            {/* Benefits list */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h5 className="text-sm font-semibold text-gray-900 mb-3">What you'll get:</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Participate in tournaments and auctions
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Showcase your skills and ratings
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Connect with other players
                </li>
              </ul>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/player-profile"
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl text-center font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Create Player Profile
            </Link>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl text-center font-medium hover:bg-gray-200 transition-colors border border-gray-200"
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
