import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getSupabaseClient } from '@/src/lib/supabaseClient'
import { secureSessionManager } from '@/src/lib/secure-session'
import { showToast } from '@/components/common/ToastNotification'
import { logger } from '@/lib/logger'

interface Player {
  id: string
  display_name: string
  profile_pic_url?: string
  bio?: string
}

interface TeamPlayer extends Player {
  sold_price?: number
  is_replacement?: boolean
}

interface PlayerReplacementModalProps {
  isOpen: boolean
  onClose: () => void
  auctionId: string
  teamId: string
  teamName: string
  teamPlayers: TeamPlayer[]
  onReplacementComplete: () => void
}

export const PlayerReplacementModal: React.FC<PlayerReplacementModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  teamId,
  teamName,
  teamPlayers,
  onReplacementComplete
}) => {
  const [selectedOriginalPlayer, setSelectedOriginalPlayer] = useState<string>('')
  const [selectedReplacementPlayer, setSelectedReplacementPlayer] = useState<string>('')
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [reason, setReason] = useState<string>('Player unavailable for tournament')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [fetchingPlayers, setFetchingPlayers] = useState(false)
  
  const supabase = getSupabaseClient()

  // Fetch available players for replacement
  useEffect(() => {
    if (isOpen) {
      fetchAvailablePlayers()
    }
  }, [isOpen])

  const fetchAvailablePlayers = async () => {
    setFetchingPlayers(true)
    try {
      // Get all players
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, display_name, profile_pic_url, bio')
        .order('display_name')
      
      if (playersError) {
        logger.error('Error fetching players', playersError)
        return
      }
      
      // Get players already in this auction
      const { data: auctionPlayers, error: auctionError } = await supabase
        .from('auction_players')
        .select('player_id')
        .eq('auction_id', auctionId)
        .eq('status', 'sold')
      
      if (auctionError) {
        logger.error('Error fetching auction players', auctionError)
        return
      }
      
      // Filter out players already in the auction
      const soldPlayerIds = new Set(auctionPlayers?.map((ap: any) => ap.player_id) || [])
      const available = allPlayers?.filter((p: Player) => !soldPlayerIds.has(p.id)) || []
      
      setAvailablePlayers(available)
    } catch (error) {
      logger.error('Error fetching available players', error)
    } finally {
      setFetchingPlayers(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedOriginalPlayer || !selectedReplacementPlayer) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please select both the player to replace and the replacement player'
      })
      return
    }
    
    setLoading(true)
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        throw new Error('Authentication required')
      }
      
      const response = await fetch(`/api/auctions/${auctionId}/replacements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamId,
          originalPlayerId: selectedOriginalPlayer,
          replacementPlayerId: selectedReplacementPlayer,
          reason
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: result.status === 'approved' 
            ? 'Replacement completed successfully' 
            : 'Replacement submitted for approval'
        })
        onReplacementComplete()
        handleClose()
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to add replacement'
        })
      }
    } catch (error: any) {
      logger.error('Error submitting replacement', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to add replacement'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleClose = () => {
    setSelectedOriginalPlayer('')
    setSelectedReplacementPlayer('')
    setReason('Player unavailable for tournament')
    setSearchTerm('')
    onClose()
  }
  
  // Filter available players based on search
  const filteredPlayers = availablePlayers.filter(player =>
    player.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  if (!isOpen) return null
  
  if (typeof window === 'undefined') return null
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1A1A1A] rounded-xl shadow-2xl border border-[#CEA17A]/30 w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A1810] to-[#3E2418] border-b border-[#CEA17A]/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#CEA17A]">
                Add Replacement Player
              </h2>
              <p className="text-[#DBD0C0]/70 mt-1">
                Replace a player in {teamName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-[#DBD0C0]/60 hover:text-[#DBD0C0] transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: Select player to replace */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#CEA17A] mb-2">
              Step 1: Select player to replace
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamPlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedOriginalPlayer(player.id)}
                  disabled={loading}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all
                    ${selectedOriginalPlayer === player.id 
                      ? 'border-red-500 bg-red-500/10' 
                      : 'border-[#CEA17A]/20 hover:border-[#CEA17A]/40 bg-[#2A1810]/20'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {player.profile_pic_url ? (
                    <img
                      src={player.profile_pic_url}
                      alt={player.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#CEA17A]/20 flex items-center justify-center">
                      <span className="text-[#CEA17A] font-bold">
                        {player.display_name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-[#DBD0C0] font-medium">
                      {player.display_name}
                    </p>
                    {player.sold_price && (
                      <p className="text-xs text-[#CEA17A]/60">
                        ₹{player.sold_price.toLocaleString()}
                      </p>
                    )}
                    {player.is_replacement && (
                      <span className="text-xs text-yellow-500">Replacement</span>
                    )}
                  </div>
                  {selectedOriginalPlayer === player.id && (
                    <div className="text-red-500">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Step 2: Select replacement player */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#CEA17A] mb-2">
              Step 2: Select replacement player
            </label>
            
            {/* Search bar */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-[#2A1810]/50 border border-[#CEA17A]/20 rounded-lg text-[#DBD0C0] placeholder-[#DBD0C0]/40 focus:outline-none focus:border-[#CEA17A]/40"
              />
            </div>
            
            {/* Players list */}
            <div className="max-h-64 overflow-y-auto border border-[#CEA17A]/20 rounded-lg">
              {fetchingPlayers ? (
                <div className="p-8 text-center text-[#DBD0C0]/60">
                  Loading players...
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="p-8 text-center text-[#DBD0C0]/60">
                  No available players found
                </div>
              ) : (
                <div className="divide-y divide-[#CEA17A]/10">
                  {filteredPlayers.map(player => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedReplacementPlayer(player.id)}
                      disabled={loading}
                      className={`
                        w-full flex items-center gap-3 p-3 transition-all
                        ${selectedReplacementPlayer === player.id 
                          ? 'bg-green-500/10' 
                          : 'hover:bg-[#CEA17A]/5'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {player.profile_pic_url ? (
                        <img
                          src={player.profile_pic_url}
                          alt={player.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#CEA17A]/20 flex items-center justify-center">
                          <span className="text-[#CEA17A] text-sm font-bold">
                            {player.display_name[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-[#DBD0C0] font-medium">
                          {player.display_name}
                        </p>
                        {player.bio && (
                          <p className="text-xs text-[#DBD0C0]/60 truncate">
                            {player.bio}
                          </p>
                        )}
                      </div>
                      {selectedReplacementPlayer === player.id && (
                        <div className="text-green-500 text-xl">✓</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Step 3: Add reason */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#CEA17A] mb-2">
              Step 3: Reason for replacement (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for replacement..."
              rows={3}
              className="w-full px-4 py-2 bg-[#2A1810]/50 border border-[#CEA17A]/20 rounded-lg text-[#DBD0C0] placeholder-[#DBD0C0]/40 focus:outline-none focus:border-[#CEA17A]/40 resize-none"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-[#CEA17A]/30 p-6 bg-[#1A1A1A]">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 text-[#DBD0C0]/70 hover:text-[#DBD0C0] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedOriginalPlayer || !selectedReplacementPlayer}
              className="px-6 py-2 bg-[#CEA17A] text-[#1A1A1A] font-semibold rounded-lg hover:bg-[#CEA17A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Add Replacement'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PlayerReplacementModal
