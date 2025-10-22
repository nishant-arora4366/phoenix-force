import React, { useState, useEffect } from 'react'
import { secureSessionManager } from '@/src/lib/secure-session'
import { showToast } from '@/components/common/ToastNotification'
import { logger } from '@/lib/logger'

interface Replacement {
  id: string
  original_player: {
    id: string
    display_name: string
    profile_pic_url?: string
  }
  replacement_player: {
    id: string
    display_name: string
    profile_pic_url?: string
  }
  team: {
    id: string
    team_name: string
  }
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  replaced_at: string
  replaced_by_user?: {
    username?: string
    email?: string
    firstname?: string
    lastname?: string
  }
  approved_by_user?: {
    username?: string
    email?: string
    firstname?: string
    lastname?: string
  }
  approved_at?: string
}

interface ReplacementHistoryProps {
  auctionId: string
  isAdmin: boolean
  onStatusChange?: () => void
}

export const ReplacementHistory: React.FC<ReplacementHistoryProps> = ({
  auctionId,
  isAdmin,
  onStatusChange
}) => {
  const [replacements, setReplacements] = useState<Replacement[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    fetchReplacements()
  }, [auctionId])

  const fetchReplacements = async () => {
    setLoading(true)
    try {
      const token = secureSessionManager.getToken()
      if (!token) return
      
      const response = await fetch(`/api/auctions/${auctionId}/replacements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReplacements(data.replacements || [])
      }
    } catch (error) {
      logger.error('Error fetching replacements', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch replacement history'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (replacementId: string) => {
    setProcessingId(replacementId)
    try {
      const token = secureSessionManager.getToken()
      if (!token) throw new Error('Authentication required')
      
      const response = await fetch(`/api/auctions/${auctionId}/replacements`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replacementId,
          action: 'approve'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Replacement approved successfully'
        })
        fetchReplacements()
        onStatusChange?.()
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to approve replacement'
        })
      }
    } catch (error: any) {
      logger.error('Error approving replacement', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to approve replacement'
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (replacementId: string) => {
    setProcessingId(replacementId)
    try {
      const token = secureSessionManager.getToken()
      if (!token) throw new Error('Authentication required')
      
      const response = await fetch(`/api/auctions/${auctionId}/replacements`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replacementId,
          action: 'reject'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Replacement rejected'
        })
        fetchReplacements()
        onStatusChange?.()
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to reject replacement'
        })
      }
    } catch (error: any) {
      logger.error('Error rejecting replacement', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to reject replacement'
      })
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserName = (user?: any) => {
    if (!user) return 'Unknown'
    return user.username || 
           `${user.firstname || ''} ${user.lastname || ''}`.trim() || 
           user.email || 
           'Unknown'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-500 bg-green-500/10 border-green-500/30'
      case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/30'
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30'
    }
  }

  const filteredReplacements = filter === 'all' 
    ? replacements 
    : replacements.filter(r => r.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
          <p className="text-[#DBD0C0]/70">Loading replacement history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-xl font-bold text-[#CEA17A]">Replacement History</h3>
        
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-[#CEA17A] text-[#1A1A1A]'
                  : 'bg-[#2A1810]/50 text-[#DBD0C0]/60 hover:text-[#DBD0C0]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-1">
                  ({replacements.filter(r => r.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Replacements List */}
      {filteredReplacements.length === 0 ? (
        <div className="bg-[#2A1810]/20 rounded-xl border border-[#CEA17A]/20 p-8 text-center">
          <p className="text-[#DBD0C0]/60">No replacements found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReplacements.map(replacement => (
            <div
              key={replacement.id}
              className="bg-gradient-to-br from-[#2A1810]/30 to-[#1A1A1A]/30 rounded-xl border border-[#CEA17A]/20 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Replacement Details */}
                <div className="flex-1 space-y-3">
                  {/* Players */}
                  <div className="flex items-center gap-3">
                    {/* Original Player */}
                    <div className="flex items-center gap-2">
                      {replacement.original_player.profile_pic_url ? (
                        <img
                          src={replacement.original_player.profile_pic_url}
                          alt={replacement.original_player.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <span className="text-red-500 text-sm font-bold">
                            {replacement.original_player.display_name[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-[#DBD0C0] font-medium">
                          {replacement.original_player.display_name}
                        </p>
                        <p className="text-xs text-red-400">Replaced</p>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <span className="text-[#CEA17A]">→</span>
                    
                    {/* Replacement Player */}
                    <div className="flex items-center gap-2">
                      {replacement.replacement_player.profile_pic_url ? (
                        <img
                          src={replacement.replacement_player.profile_pic_url}
                          alt={replacement.replacement_player.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-500 text-sm font-bold">
                            {replacement.replacement_player.display_name[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-[#DBD0C0] font-medium">
                          {replacement.replacement_player.display_name}
                        </p>
                        <p className="text-xs text-green-400">Replacement</p>
                      </div>
                    </div>
                  </div>

                  {/* Team and Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#DBD0C0]/60">
                    <span>Team: <span className="text-[#CEA17A]">{replacement.team.team_name}</span></span>
                    <span>By: {getUserName(replacement.replaced_by_user)}</span>
                    <span>{formatDate(replacement.replaced_at)}</span>
                  </div>

                  {/* Reason */}
                  {replacement.reason && (
                    <p className="text-sm text-[#DBD0C0]/70 italic">
                      Reason: {replacement.reason}
                    </p>
                  )}

                  {/* Approval Info */}
                  {replacement.approved_by_user && replacement.approved_at && (
                    <p className="text-xs text-[#DBD0C0]/50">
                      {replacement.status === 'approved' ? 'Approved' : 'Rejected'} by {getUserName(replacement.approved_by_user)} on {formatDate(replacement.approved_at)}
                    </p>
                  )}
                </div>

                {/* Status and Actions */}
                <div className="flex flex-col items-end gap-2">
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(replacement.status)}`}>
                    {replacement.status.toUpperCase()}
                  </span>

                  {/* Admin Actions for Pending */}
                  {isAdmin && replacement.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApprove(replacement.id)}
                        disabled={processingId === replacement.id}
                        className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {processingId === replacement.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(replacement.id)}
                        disabled={processingId === replacement.id}
                        className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {processingId === replacement.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReplacementHistory
