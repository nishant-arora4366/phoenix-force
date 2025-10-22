/**
 * Example integration component showing how to use the replacement system
 * in your auction page
 */

import React, { useState } from 'react'
import { TeamFormation } from './TeamFormation'
import { ReplacementHistory } from './ReplacementHistory'
import { USER_ROLES } from '@/lib/constants'

interface AuctionTeamViewProps {
  auctionId: string
  auctionStatus: string
  userRole?: string
  userId?: string
  auctionCreatedBy?: string
}

export const AuctionTeamView: React.FC<AuctionTeamViewProps> = ({
  auctionId,
  auctionStatus,
  userRole,
  userId,
  auctionCreatedBy
}) => {
  const [activeTab, setActiveTab] = useState<'formation' | 'history'>('formation')
  
  // Permission checks
  const isAdmin = userRole === USER_ROLES.ADMIN
  const isHost = userRole === USER_ROLES.HOST
  const isOwnAuction = userId && auctionCreatedBy === userId
  const canManageReplacements = (isAdmin || (isHost && isOwnAuction)) && auctionStatus === 'completed'
  const showReplacementFeatures = auctionStatus === 'completed'

  if (!showReplacementFeatures) {
    return (
      <div className="bg-[#2A1810]/20 rounded-xl border border-[#CEA17A]/20 p-8">
        <div className="text-center">
          <h3 className="text-xl font-bold text-[#CEA17A] mb-2">
            Auction Not Completed
          </h3>
          <p className="text-[#DBD0C0]/60">
            Team formations and replacements will be available once the auction is completed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      {canManageReplacements && (
        <div className="flex items-center gap-1 p-1 bg-[#2A1810]/30 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('formation')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'formation'
                ? 'bg-[#CEA17A] text-[#1A1A1A]'
                : 'text-[#DBD0C0]/60 hover:text-[#DBD0C0]'
            }`}
          >
            Team Formation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-[#CEA17A] text-[#1A1A1A]'
                : 'text-[#DBD0C0]/60 hover:text-[#DBD0C0]'
            }`}
          >
            Replacement History
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === 'formation' ? (
        <TeamFormation
          auctionId={auctionId}
          auctionStatus={auctionStatus}
          isHost={isHost}
          isAdmin={isAdmin}
        />
      ) : (
        <ReplacementHistory
          auctionId={auctionId}
          isAdmin={isAdmin}
          onStatusChange={() => {
            // You can refresh data or show a notification here
          }}
        />
      )}

      {/* Info Box for Non-Admin/Host Users */}
      {!canManageReplacements && (
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            ℹ️ Player replacements can only be managed by the auction host or administrators.
          </p>
        </div>
      )}
    </div>
  )
}

export default AuctionTeamView
