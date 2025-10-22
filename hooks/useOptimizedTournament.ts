import { useState, useEffect, useCallback } from 'react'
import { realtimeManager } from '@/lib/realtime-manager'
import { secureSessionManager } from '@/src/lib/secure-session'
import { getSupabaseClient } from '@/src/lib/supabaseClient'
import { logger } from '@/lib/logger'

interface Tournament {
  id: string
  name: string
  format: string
  tournament_date: string
  status: string
  [key: string]: any
}

interface TournamentSlot {
  id: string
  tournament_id: string
  player_id: string
  slot_number: number
  status: string
  registered_at: string
  registered_by?: string
  [key: string]: any
}

interface UseOptimizedTournamentOptions {
  tournamentId: string
  userId?: string
  enableRealtime?: boolean
}

export function useOptimizedTournament({ 
  tournamentId, 
  userId,
  enableRealtime = true 
}: UseOptimizedTournamentOptions) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [slots, setSlots] = useState<TournamentSlot[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [userRegistration, setUserRegistration] = useState<any | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tournament data
  const fetchTournamentData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()

      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single()

      if (tournamentError) throw tournamentError
      setTournament(tournamentData)

      // Fetch slots with player details
      const { data: slotsData, error: slotsError } = await supabase
        .from('tournament_slots')
        .select(`
          *,
          player:players(
            id,
            display_name,
            profile_pic_url,
            bio
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('slot_number', { ascending: true })

      if (slotsError) throw slotsError
      
      setSlots(slotsData || [])
      setPlayers(slotsData?.map((s: any) => s.player).filter(Boolean) || [])

      // Fetch user registration if userId provided
      if (userId) {
        const { data: userPlayer } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (userPlayer) {
          const userSlot = slotsData?.find((s: any) => s.player_id === userPlayer.id)
          setUserRegistration(userSlot || null)
        }
      }

      setError(null)
    } catch (err: any) {
      logger.error('Error fetching tournament', err)
      setError(err.message || 'Failed to load tournament')
    } finally {
      setIsLoading(false)
    }
  }, [tournamentId, userId])

  // Register for tournament
  const registerForTournament = useCallback(async () => {
    const token = secureSessionManager.getToken()
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to register')
    }

    const result = await response.json()
    
    // Optimistically update local state
    if (result.slot) {
      setSlots(prev => [...prev, result.slot])
      setUserRegistration(result.slot)
    }

    return result
  }, [tournamentId])

  // Cancel registration
  const cancelRegistration = useCallback(async (slotId: string) => {
    const token = secureSessionManager.getToken()
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`/api/tournaments/${tournamentId}/slots`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ slotId })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to cancel registration')
    }

    // Optimistically update local state
    setSlots(prev => prev.filter(s => s.id !== slotId))
    if (userRegistration?.id === slotId) {
      setUserRegistration(null)
    }

    return response.json()
  }, [tournamentId, userRegistration])

  // Setup optimized realtime subscriptions
  useEffect(() => {
    if (!enableRealtime || !tournamentId) return

    fetchTournamentData()

    // Create single multiplexed channel for all tournament updates
    const unsubscribe = realtimeManager.subscribe(
      `tournament-${tournamentId}`,
      {
        tables: [
          {
            table: 'tournaments',
            filter: `id=eq.${tournamentId}`,
            events: ['UPDATE']
          },
          {
            table: 'tournament_slots',
            filter: `tournament_id=eq.${tournamentId}`,
            events: ['*']
          }
        ],
        debounceMs: 100, // Batch updates every 100ms
        onUpdate: (updates) => {
          // Process batched updates
          updates.forEach(({ table, type, payload }) => {
            switch (table) {
              case 'tournaments':
                if (type === 'UPDATE' && payload.new) {
                  setTournament(prev => prev ? { ...prev, ...payload.new } : payload.new)
                }
                break

              case 'tournament_slots':
                if (type === 'INSERT') {
                  setSlots(prev => {
                    const exists = prev.find(s => s.id === payload.new.id)
                    if (exists) return prev
                    return [...prev, payload.new].sort((a, b) => a.slot_number - b.slot_number)
                  })
                } else if (type === 'UPDATE') {
                  setSlots(prev => prev.map(s => 
                    s.id === payload.new.id ? { ...s, ...payload.new } : s
                  ))
                } else if (type === 'DELETE') {
                  setSlots(prev => prev.filter(s => s.id !== payload.old.id))
                  if (userRegistration?.id === payload.old.id) {
                    setUserRegistration(null)
                  }
                }
                break
            }
          })
        },
        onError: (error) => {
          console.error('Realtime subscription error:', error)
        }
      }
    )

    // Setup notifications channel if user is authenticated
    const user = secureSessionManager.getUser()
    let notificationUnsub: (() => void) | null = null

    if (user) {
      notificationUnsub = realtimeManager.subscribe(
        `notifications-${user.id}`,
        {
          tables: [
            {
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
              events: ['INSERT', 'UPDATE']
            }
          ],
          debounceMs: 200, // Less frequent for notifications
          onUpdate: (updates) => {
            updates.forEach(({ type, payload }) => {
              if (type === 'INSERT') {
                setNotifications(prev => [payload.new, ...prev])
                // You can trigger toast notifications here
              } else if (type === 'UPDATE') {
                setNotifications(prev => prev.map(n => 
                  n.id === payload.new.id ? { ...n, ...payload.new } : n
                ))
              }
            })
          }
        }
      )
    }

    return () => {
      unsubscribe()
      if (notificationUnsub) notificationUnsub()
    }
  }, [tournamentId, userId, enableRealtime, fetchTournamentData])

  return {
    // State
    tournament,
    slots,
    players,
    userRegistration,
    notifications,
    isLoading,
    error,
    
    // Actions
    registerForTournament,
    cancelRegistration,
    refetch: fetchTournamentData,
    
    // Computed values
    isRegistered: !!userRegistration,
    availableSlots: tournament ? tournament.max_players - slots.length : 0,
    isFull: tournament ? slots.length >= tournament.max_players : false
  }
}
