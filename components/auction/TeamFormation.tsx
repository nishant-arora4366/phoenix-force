import React, { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/src/lib/supabaseClient'
import { secureSessionManager } from '@/src/lib/secure-session'
import { USER_ROLES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { PlayerReplacementModal } from './PlayerReplacementModal'
import { showToast } from '@/components/common/ToastNotification'

interface Player {
  id: string
  display_name: string
  profile_pic_url?: string
  sold_price?: number
  is_replacement?: boolean
  replaced_player_name?: string
  replacement_date?: string
}

interface Team {
  id: string
  team_name: string
  captain_id: string
  total_spent: number
  remaining_purse: number
  players_count: number
  players?: Player[]
}

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
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  replaced_at: string
  replaced_by_user?: {
    username?: string
    email?: string
  }
}

interface TeamFormationProps {
  auctionId: string
  auctionStatus: string
  isHost?: boolean
  isAdmin?: boolean
}

export const TeamFormation: React.FC<TeamFormationProps> = ({
  auctionId,
  auctionStatus,
  isHost = false,
  isAdmin = false
}) => {
  const [teams, setTeams] = useState<Team[]>([])
  const [replacements, setReplacements] = useState<Replacement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showReplacementModal, setShowReplacementModal] = useState(false)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  
  const supabase = getSupabaseClient()
  const canAddReplacements = (isHost || isAdmin) && auctionStatus === 'completed'

  useEffect(() => {
    fetchTeamFormations()
    if (canAddReplacements) {
      fetchReplacements()
    }
  }, [auctionId])

  const fetchTeamFormations = async () => {
    setLoading(true)
    try {
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('auction_teams')
        .select('*')
        .eq('auction_id', auctionId)
        .order('team_name')
      
      if (teamsError) {
        logger.error('Error fetching teams', teamsError)
        return
      }
      
      // Fetch team formations with replacements
      const { data: formationData, error: formationError } = await supabase
        .rpc('get_team_formation_with_replacements', {
          p_auction_id: auctionId
        })
      
      if (formationError) {
        logger.error('Error fetching team formations', formationError)
        
        // Fallback to regular query if function doesn't exist
        const { data: playersData } = await supabase
          .from('auction_players')
          .select(`
            *,
            player:players(id, display_name, profile_pic_url)
          `)
          .eq('auction_id', auctionId)
          .eq('status', 'sold')
        
        // Group players by team
        const teamMap = new Map<string, Team>()
        teamsData?.forEach((team: any) => {
          teamMap.set(team.id, {
            ...team,
            players: []
          })
        })
        
        playersData?.forEach((ap: any) => {
          if (ap.sold_to && teamMap.has(ap.sold_to)) {
            const team = teamMap.get(ap.sold_to)!
            team.players?.push({
              id: ap.player.id,
              display_name: ap.player.display_name,
              profile_pic_url: ap.player.profile_pic_url,
              sold_price: ap.sold_price,
              is_replacement: false
            })
          }
        })
        
        setTeams(Array.from(teamMap.values()))
      } else {
        // Group formation data by team
        const teamMap = new Map<string, Team>()
        
        formationData?.forEach((row: any) => {
          if (!teamMap.has(row.team_id)) {
            const teamData = teamsData?.find((t: any) => t.id === row.team_id)
            if (teamData) {
              teamMap.set(row.team_id, {
                ...teamData,
                players: []
              })
            }
          }
          
          const team = teamMap.get(row.team_id)
          if (team) {
            team.players?.push({
              id: row.player_id,
              display_name: row.player_name,
              profile_pic_url: row.player_image,
              sold_price: row.sold_price,
              is_replacement: row.is_replacement,
              replaced_player_name: row.replaced_player_name,
              replacement_date: row.replacement_date
            })
          }
        })
        
        setTeams(Array.from(teamMap.values()))
      }
    } catch (error) {
      logger.error('Error fetching team formations', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReplacements = async () => {
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
    }
  }

  const handleAddReplacement = (team: Team) => {
    setSelectedTeam(team)
    setShowReplacementModal(true)
  }

  const handleReplacementComplete = () => {
    fetchTeamFormations()
    fetchReplacements()
  }

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const getPendingReplacements = (teamId: string) => {
    return replacements.filter(r => r.status === 'pending' && teams.some(t => t.id === teamId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
          <p className="text-[#DBD0C0]/70">Loading team formations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#CEA17A]">Team Formations</h2>
        {canAddReplacements && (
          <div className="text-sm text-[#DBD0C0]/60">
            Click "Add Replacement" to substitute unavailable players
          </div>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teams.map(team => {
          const isExpanded = expandedTeams.has(team.id)
          const pendingReplacements = getPendingReplacements(team.id)
          
          return (
            <div
              key={team.id}
              className="bg-gradient-to-br from-[#2A1810]/50 to-[#1A1A1A]/50 rounded-xl border border-[#CEA17A]/30 overflow-hidden"
            >
              {/* Team Header */}
              <div className="bg-gradient-to-r from-[#3E2418] to-[#2A1810] p-4 border-b border-[#CEA17A]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#CEA17A]">
                      {team.team_name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[#DBD0C0]/60">
                      <span>Players: {team.players?.length || 0}/{team.players_count}</span>
                      <span>Spent: ₹{team.total_spent.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTeamExpansion(team.id)}
                    className="text-[#CEA17A] hover:text-[#CEA17A]/80 transition-colors"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>

                {/* Pending Replacements Badge */}
                {pendingReplacements.length > 0 && (
                  <div className="mt-2 px-2 py-1 bg-yellow-500/20 rounded text-xs text-yellow-400 inline-block">
                    {pendingReplacements.length} pending replacement(s)
                  </div>
                )}
              </div>

              {/* Team Players */}
              {isExpanded && (
                <div className="p-4">
                  {/* Captain */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#CEA17A]/70 mb-2">CAPTAIN</p>
                    {team.players?.find(p => p.id === team.captain_id) && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-[#CEA17A]/10">
                        {team.players.find(p => p.id === team.captain_id)?.profile_pic_url ? (
                          <img
                            src={team.players.find(p => p.id === team.captain_id)?.profile_pic_url}
                            alt="Captain"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#CEA17A]/20 flex items-center justify-center">
                            <span className="text-[#CEA17A] font-bold">C</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-[#DBD0C0] font-medium">
                            {team.players.find(p => p.id === team.captain_id)?.display_name}
                          </p>
                          <p className="text-xs text-[#CEA17A]">Captain</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Players */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#CEA17A]/70 mb-2">PLAYERS</p>
                    {team.players
                      ?.filter(p => p.id !== team.captain_id)
                      .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
                      .map(player => (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-[#1A1A1A]/50 hover:bg-[#1A1A1A]/70 transition-colors"
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
                          <div className="flex-1">
                            <p className="text-[#DBD0C0] font-medium">
                              {player.display_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              {player.sold_price && (
                                <span className="text-[#CEA17A]/60">
                                  ₹{player.sold_price.toLocaleString()}
                                </span>
                              )}
                              {player.is_replacement && (
                                <span className="text-yellow-500">
                                  Replacement for {player.replaced_player_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Add Replacement Button */}
                  {canAddReplacements && (
                    <button
                      onClick={() => handleAddReplacement(team)}
                      className="mt-4 w-full py-2 bg-[#CEA17A]/20 hover:bg-[#CEA17A]/30 text-[#CEA17A] font-medium rounded-lg transition-colors border border-[#CEA17A]/30"
                    >
                      + Add Replacement
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Replacement Modal */}
      {selectedTeam && (
        <PlayerReplacementModal
          isOpen={showReplacementModal}
          onClose={() => {
            setShowReplacementModal(false)
            setSelectedTeam(null)
          }}
          auctionId={auctionId}
          teamId={selectedTeam.id}
          teamName={selectedTeam.team_name}
          teamPlayers={selectedTeam.players || []}
          onReplacementComplete={handleReplacementComplete}
        />
      )}
    </div>
  )
}

export default TeamFormation
