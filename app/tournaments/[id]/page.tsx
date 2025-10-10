'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { sessionManager } from '@/src/lib/session'
import { getSupabaseClient } from '@/src/lib/supabaseClient'

interface Tournament {
  id: string
  name: string
  format: string
  selected_teams: number
  tournament_date: string
  description?: string
  host_id: string
  status: string
  total_slots: number
  venue?: string
  google_maps_link?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
}

// Status flow definition - bidirectional with logical transitions
const statusFlow = {
  'draft': ['registration_open'],
  'registration_open': ['registration_closed', 'draft'],
  'registration_closed': ['auction_started', 'registration_open'],
  'auction_started': ['auction_completed', 'registration_closed'],
  'auction_completed': ['teams_formed', 'auction_started'],
  'teams_formed': ['completed', 'auction_completed'],
  'completed': ['teams_formed']
}

// Status display names
const statusDisplayNames = {
  'draft': 'Draft',
  'registration_open': 'Registration Open',
  'registration_closed': 'Registration Closed',
  'auction_started': 'Auction Started',
  'auction_completed': 'Auction Completed',
  'teams_formed': 'Teams Formed',
  'completed': 'Completed'
}

// Helper function to get available status transitions
const getAvailableTransitions = (currentStatus: string) => {
  return statusFlow[currentStatus as keyof typeof statusFlow] || []
}

// Helper function to check if user is admin
const isAdmin = (user: any) => {
  return user?.role === 'admin'
}

export default function TournamentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [hostInfo, setHostInfo] = useState<User | null>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [slotsStats, setSlotsStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [isRealtimeUpdating, setIsRealtimeUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('')
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [userRegistration, setUserRegistration] = useState<any>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [waitlistStatus, setWaitlistStatus] = useState<any>(null)
  
  // Player assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [allPlayers, setAllPlayers] = useState<any[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([])
  const [assignStatus, setAssignStatus] = useState<'pending' | 'confirmed'>('pending')
  const [isAssigning, setIsAssigning] = useState(false)
  
  // Skills filtering state
  const [availableSkills, setAvailableSkills] = useState<any[]>([])
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedSkillValue, setSelectedSkillValue] = useState('')
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [hideAssignedPlayers, setHideAssignedPlayers] = useState(false)
  
  // Advanced filtering state
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [activeFilters, setActiveFilters] = useState<{
    search: boolean
    skills: boolean
    hideAssigned: boolean
  }>({
    search: true,
    skills: false,
    hideAssigned: false
  })
  const [multipleSkillFilters, setMultipleSkillFilters] = useState<Array<{
    skillId: string
    skillName: string
    value: string
    valueName: string
  }>>([])
  
  // New filter system state
  const [enabledSkills, setEnabledSkills] = useState<string[]>([])
  const [skillFilterValues, setSkillFilterValues] = useState<{[key: string]: string[]}>({})
  const [showSkillConfig, setShowSkillConfig] = useState(false)

  // Initialize Supabase client for realtime (singleton to avoid multiple instances)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTournamentAndUser = async () => {
      try {
        // Get current user from session manager
        const sessionUser = sessionManager.getUser()
        setUser(sessionUser)

        // Fetch tournament data via API
        const response = await fetch(`/api/tournaments/${tournamentId}`)
        if (!response.ok) {
          setError('Tournament not found')
          return
        }
        
        const result = await response.json()
        if (!result.success) {
          setError('Tournament not found')
          return
        }
        
        const tournamentData = result.tournament
        setTournament(tournamentData)

        // Fetch host information
        const hostResponse = await fetch(`/api/user-profile?userId=${tournamentData.host_id}`)
        if (hostResponse.ok) {
          const hostResult = await hostResponse.json()
          if (hostResult.success) {
            setHostInfo(hostResult.data)
          }
        }

        if (sessionUser) {
          // Fetch user profile
          const response = await fetch(`/api/user-profile?userId=${sessionUser.id}`)
          const result = await response.json()
          if (result.success) {
            setUserProfile(result.data)
            // Check if user is admin or the tournament host
            const isAdmin = result.data.role === 'admin'
            const isTournamentHost = sessionUser.id === tournamentData.host_id
            setIsHost(isAdmin || isTournamentHost)
          }
        }

        // Fetch tournament slots for everyone (public information)
        await fetchSlots()

        // Fetch user-specific data only for authenticated users
        if (sessionUser) {
          const userResponse = await fetch(`/api/user-profile?userId=${sessionUser.id}`)
          const userResult = await userResponse.json()
          if (userResult.success) {
            const isAdmin = userResult.data.role === 'admin'
            const isTournamentHost = sessionUser.id === tournamentData.host_id
            const isViewer = userResult.data.role === 'viewer'
            
            // Check if user is already registered for this tournament
            await checkUserRegistration()
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Error loading tournament')
      } finally {
        setIsLoading(false)
      }
    }

    if (tournamentId) {
      fetchTournamentAndUser()
    }
  }, [tournamentId])

  // Realtime subscription for tournament slots and notifications
  useEffect(() => {
    if (!tournamentId) return

    console.log('Setting up realtime subscription for tournament:', tournamentId)

    // Subscribe to changes in tournament_slots table for this tournament
    const slotsChannel = supabase
      .channel(`tournament-slots-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tournament_slots',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload: any) => {
          console.log('Realtime INSERT received:', payload)
          fetchSlots(true)
          // Only check user registration if user is authenticated
          const currentUser = sessionManager.getUser()
          if (currentUser) {
            checkUserRegistration()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_slots',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload: any) => {
          console.log('Realtime UPDATE received:', payload)
          fetchSlots(true)
          // Only check user registration if user is authenticated
          const currentUser = sessionManager.getUser()
          if (currentUser) {
            checkUserRegistration()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tournament_slots'
        },
        (payload: any) => {
          console.log('Realtime DELETE received (no filter):', payload)
          // Since DELETE payload only contains id, we'll refresh for any DELETE
          // The fetchSlots() will only return slots for the current tournament anyway
          console.log('DELETE event received, refreshing slots...')
          fetchSlots(true)
          // Only check user registration if user is authenticated
          const currentUser = sessionManager.getUser()
          if (currentUser) {
            checkUserRegistration()
          }
        }
      )
      .subscribe((status: any) => {
        console.log('Slots subscription status:', status)
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    // Subscribe to tournament status changes
    const tournamentChannel = supabase
      .channel(`tournament-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        (payload: any) => {
          console.log('Tournament status updated:', payload)
          // Update local tournament state with new status
          setTournament(prev => {
            if (prev && payload.new) {
              return { ...prev, ...payload.new }
            }
            return prev
          })
          
          // Show notification to user about status change
          if (payload.new && payload.new.status) {
            const statusText = getStatusText(payload.new.status)
            setRegistrationMessage(`Tournament status updated to: ${statusText}`)
            setTimeout(() => setRegistrationMessage(''), 5000)
          }
        }
      )
      .subscribe((status: any) => {
        console.log('Tournament subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to tournament updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to tournament updates - real-time may not be enabled for tournaments table')
        }
      })

    // Subscribe to notifications for the current user (only if authenticated)
    let notificationsChannel = null
    if (user) {
      notificationsChannel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload: any) => {
            console.log('New notification received:', payload)
            setNotifications(prev => [payload.new, ...prev])
            
            // Show notification to user
            if (payload.new.type === 'waitlist_promotion') {
              setRegistrationMessage(`🎉 You have been promoted from the waitlist to a main slot!`)
              setTimeout(() => setRegistrationMessage(''), 10000)
            }
          }
        )
        .subscribe()
    }

    // Cleanup subscriptions on component unmount
    return () => {
      console.log('Cleaning up realtime subscriptions')
      supabase.removeChannel(slotsChannel)
      supabase.removeChannel(tournamentChannel)
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel)
      }
    }
  }, [tournamentId])

  // Load players and skills when modal opens
  useEffect(() => {
    if (showAssignModal) {
      loadAllPlayers()
      loadSkills()
    }
  }, [showAssignModal])

  // Filter players client-side when filters change
  useEffect(() => {
    if (showAssignModal && allPlayers.length > 0) {
      filterPlayers()
    }
  }, [searchTerm, hideAssignedPlayers, skillFilterValues, allPlayers])

  // Subscribe to session changes to handle sign-in/sign-out
  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((userData) => {
      console.log('Session changed:', userData)
      setUser(userData)
      
      // If user signed out, clear user-specific data
      if (!userData) {
        setUserProfile(null)
        setUserRegistration(null)
        setNotifications([])
        setIsHost(false) // Critical: Clear host status on sign-out
      } else {
        // If user signed in, refresh user-specific data
        if (tournament) {
          checkUserRegistration()
        }
      }
    })

    return () => unsubscribe()
  }, [tournament])

  // Helper function to format datetime in readable format
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Helper functions for multiple skill filters
  const addSkillFilter = () => {
    if (selectedSkill && selectedSkillValue) {
      const skill = availableSkills.find(s => s.id === selectedSkill)
      const value = skill?.values.find((v: any) => v.value_name === selectedSkillValue)
      
      if (skill && value) {
        const newFilter = {
          skillId: selectedSkill,
          skillName: skill.name,
          value: selectedSkillValue,
          valueName: value.value_name
        }
        
        // Check if this filter already exists
        const exists = multipleSkillFilters.some(f => 
          f.skillId === newFilter.skillId && f.value === newFilter.value
        )
        
        if (!exists) {
          setMultipleSkillFilters([...multipleSkillFilters, newFilter])
        }
        
        // Reset selection
        setSelectedSkill('')
        setSelectedSkillValue('')
      }
    }
  }

  const removeSkillFilter = (index: number) => {
    setMultipleSkillFilters(multipleSkillFilters.filter((_, i) => i !== index))
  }


  const toggleFilter = (filterType: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }))
  }

  // Helper function to check if a slot belongs to the current user
  const isCurrentUserSlot = (slot: any) => {
    if (!user || !slot.players?.users) return false
    return slot.players.users.id === user.id || slot.players.users.email === user.email
  }

  // Load all players function - loads all players once without filters
  const loadAllPlayers = async () => {
    if (!tournamentId) {
      console.error('Tournament ID is not available')
      return
    }
    
    setIsLoadingPlayers(true)
    try {
      // Load all players without any filters
      const params = new URLSearchParams({
        tournamentId: tournamentId
      })

      console.log('Fetching all players for tournament:', tournamentId)
      const response = await fetch(`/api/players/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Players API response:', result)
      
      if (result.success) {
        console.log('Loaded players with skills data:', result.players)
        setAllPlayers(result.players || [])
        // Initial filter will be applied by the useEffect
      } else {
        console.error('Error loading players:', result.error || 'Unknown error')
        setAllPlayers([])
        setFilteredPlayers([])
      }
    } catch (error) {
      console.error('Error loading players:', error)
      setAllPlayers([])
      setFilteredPlayers([])
    } finally {
      setIsLoadingPlayers(false)
    }
  }

  // Client-side filtering function
  const filterPlayers = () => {
    let filtered = [...allPlayers]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(player => 
        player.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply hide assigned players filter
    if (hideAssignedPlayers) {
      filtered = filtered.filter(player => !player.isRegistered)
    }

    // Apply skill filters
    Object.entries(skillFilterValues).forEach(([skillId, values]) => {
      if (values.length > 0) {
        console.log(`Applying skill filter for skill ${skillId} with values:`, values)
        
        // Get the skill definition to understand the skill type and get value names
        const skill = availableSkills.find(s => s.id === skillId)
        if (!skill) {
          console.log(`Skill ${skillId} not found in available skills`)
          return
        }
        
        // Convert skill value IDs to names for multiselect skills, but keep IDs for number skills
        const selectedValueNames = values.map(valueId => {
          if (skill.type === 'multiselect' && skill.values) {
            const valueObj = skill.values.find((v: any) => v.id === valueId)
            return valueObj ? valueObj.name : valueId
          } else if (skill.type === 'number' && skill.values) {
            // For number skills, convert ID to the actual numeric value
            const valueObj = skill.values.find((v: any) => v.id === valueId)
            console.log(`Converting number skill value: ID ${valueId} -> Value ${valueObj ? valueObj.name : valueId}`)
            return valueObj ? valueObj.name : valueId
          }
          return valueId
        })
        
        console.log(`Converted selected values to names:`, selectedValueNames)
        
        filtered = filtered.filter(player => {
          // Check if player has skills data
          if (!player.skills || !Array.isArray(player.skills)) {
            console.log(`Player ${player.display_name} has no skills data`)
            return false
          }

          // Find the skill assignment for this skill ID
          const skillAssignment = player.skills.find((skill: any) => skill.skill_id === skillId)
          
          if (!skillAssignment) {
            console.log(`Player ${player.display_name} has no assignment for skill ${skillId}`)
            return false
          }

          console.log(`Player ${player.display_name} skill assignment:`, skillAssignment)

          // Check if any of the selected values match the player's skill values
          let matches = false
          
          if (skill.type === 'number') {
            // Handle number range filtering (min/max)
            // For number skills, selectedValueNames contains the actual numeric values
            const minValue = selectedValueNames[0] ? parseFloat(selectedValueNames[0]) : null
            const maxValue = selectedValueNames[1] ? parseFloat(selectedValueNames[1]) : null
            
            console.log(`Number filter for skill ${skill.name}: min=${minValue}, max=${maxValue}`)
            console.log(`Player skill assignment:`, skillAssignment)
            console.log(`Available skill values:`, skill.values)
            
            // Get the player's skill value (could be in different fields)
            let playerValue = null
            
            // Try different ways to get the player's number value
            if (skillAssignment.skill_value_id && skill.values) {
              const valueObj = skill.values.find((v: any) => v.id === skillAssignment.skill_value_id)
              if (valueObj) {
                playerValue = parseFloat(valueObj.name)
                console.log(`Found player value from skill_value_id: ${playerValue} (from value name: ${valueObj.name})`)
              }
            }
            
            if (playerValue === null && skillAssignment.value_array && Array.isArray(skillAssignment.value_array) && skillAssignment.value_array.length > 0) {
              // For number skills, value_array might contain the actual number
              playerValue = parseFloat(skillAssignment.value_array[0])
              console.log(`Found player value from value_array: ${playerValue} (from array: ${skillAssignment.value_array})`)
            }
            
            // If still no value, try to parse any string value directly
            if (playerValue === null && skillAssignment.value) {
              playerValue = parseFloat(skillAssignment.value)
              console.log(`Found player value from value field: ${playerValue}`)
            }
            
            console.log(`Final player value: ${playerValue}, min: ${minValue}, max: ${maxValue}`)
            
            if (playerValue !== null && !isNaN(playerValue)) {
              matches = true
              if (minValue !== null && playerValue < minValue) {
                matches = false
                console.log(`Player value ${playerValue} is below minimum ${minValue}`)
              }
              if (maxValue !== null && playerValue > maxValue) {
                matches = false
                console.log(`Player value ${playerValue} is above maximum ${maxValue}`)
              }
            } else {
              console.log(`No valid player value found for number skill`)
              matches = false
            }
            
            console.log(`Number range match result: ${matches}`)
          } else {
            // Handle other skill types (select, multiselect, text)
            matches = selectedValueNames.some(selectedValueName => {
              // Handle different skill value types
              if (skillAssignment.skill_value_id) {
                // For single select skills, we need to get the value name from the skill definition
                if (skill.type === 'select' && skill.values) {
                  const valueObj = skill.values.find((v: any) => v.id === skillAssignment.skill_value_id)
                  const valueName = valueObj ? valueObj.name : String(skillAssignment.skill_value_id)
                  const match = valueName === selectedValueName
                  console.log(`Single select match: ${valueName} === ${selectedValueName} = ${match}`)
                  return match
                }
                // For other types, compare IDs directly
                const match = String(skillAssignment.skill_value_id) === String(selectedValueName)
                console.log(`ID match: ${skillAssignment.skill_value_id} === ${selectedValueName} = ${match}`)
                return match
              }
              
              // Handle array values (for multiselect skills)
              if (skillAssignment.value_array && Array.isArray(skillAssignment.value_array)) {
                const arrayMatch = skillAssignment.value_array.some((val: any) => String(val) === String(selectedValueName))
                console.log(`Array check: ${skillAssignment.value_array} includes ${selectedValueName} = ${arrayMatch}`)
                return arrayMatch
              }
              
              return false
            })
          }

          console.log(`Player ${player.display_name} matches filter: ${matches}`)
          return matches
        })
      }
    })

    setFilteredPlayers(filtered)
  }

  // Load available skills function
  const loadSkills = async () => {
    setIsLoadingSkills(true)
    try {
      const response = await fetch('/api/player-skills/list')
      const result = await response.json()
      
      if (result.success) {
        setAvailableSkills(result.skills)
      } else {
        console.error('Error loading skills:', result.error)
        setAvailableSkills([])
      }
    } catch (error) {
      console.error('Error loading skills:', error)
      setAvailableSkills([])
    } finally {
      setIsLoadingSkills(false)
    }
  }

  // Assign players function
  const assignPlayers = async () => {
    if (selectedPlayers.length === 0) return

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/assign-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerIds: selectedPlayers.map(p => p.id),
          status: assignStatus
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Refresh slots and close modal
        await fetchSlots()
        setShowAssignModal(false)
        setSelectedPlayers([])
        setSearchTerm('')
        setAllPlayers([])
        setFilteredPlayers([])
        setSelectedSkill('')
        setSelectedSkillValue('')
        setAssignStatus('pending')
        
        // Show success message
        const playerNames = selectedPlayers.map(p => p.display_name).join(', ')
        setStatusMessage(`${selectedPlayers.length} player(s) (${playerNames}) have been ${assignStatus === 'confirmed' ? 'registered with payment verified' : 'assigned'} to the tournament.`)
        setTimeout(() => setStatusMessage(''), 5000)
      } else {
        setStatusMessage(`Error: ${result.error}`)
        setTimeout(() => setStatusMessage(''), 5000)
      }
    } catch (error) {
      console.error('Error assigning players:', error)
      setStatusMessage('Error assigning players. Please try again.')
      setTimeout(() => setStatusMessage(''), 5000)
    } finally {
      setIsAssigning(false)
    }
  }

  // Toggle player selection
  const togglePlayerSelection = (player: any) => {
    if (player.isRegistered) return // Don't allow selection of registered players
    
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id)
      if (isSelected) {
        return prev.filter(p => p.id !== player.id)
      } else {
        return [...prev, player]
      }
    })
  }

  // Select all available players
  const selectAllPlayers = () => {
    const availablePlayers = filteredPlayers.filter(p => !p.isRegistered)
    setSelectedPlayers(availablePlayers)
  }

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedPlayers([])
  }

  // New filter system helper functions
  const toggleSkillEnabled = (skillId: string) => {
    setEnabledSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const updateSkillFilterValue = (skillId: string, values: string[]) => {
    setSkillFilterValues(prev => ({
      ...prev,
      [skillId]: values
    }))
  }

  const clearSkillFilter = (skillId: string) => {
    setSkillFilterValues(prev => {
      const newValues = { ...prev }
      delete newValues[skillId]
      return newValues
    })
  }

  const clearAllSkillFilters = () => {
    setSkillFilterValues({})
  }

  // Skeleton loading components
  const SlotSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex items-center space-x-4 p-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-16 h-6 bg-gray-200 rounded"></div>
      </div>
    </div>
  )

  const SlotsSkeleton = () => (
    <div className="bg-[#09171F]/50 rounded-xl border border-[#CEA17A]/20 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#CEA17A]/20">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(3)].map((_, i) => <SlotSkeleton key={i} />)}
      </div>
    </div>
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-[#3E4E5A]/20 text-[#DBD0C0] border border-[#CEA17A]/30'
      case 'registration_open':
        return 'bg-green-500/20 text-green-300 border border-green-500/30'
      case 'registration_closed':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
      case 'auction_started':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      case 'auction_completed':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
      case 'teams_formed':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
      default:
        return 'bg-[#3E4E5A]/20 text-[#DBD0C0] border border-[#CEA17A]/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'registration_open':
        return 'Registration Open'
      case 'registration_closed':
        return 'Registration Closed'
      case 'auction_started':
        return 'Auction Started'
      case 'auction_completed':
        return 'Auction Completed'
      case 'teams_formed':
        return 'Teams Formed'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  const updateTournamentStatus = async (newStatus: string) => {
    if (!tournament) return
    
    setIsUpdatingStatus(true)
    setStatusMessage('')
    
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser)
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update tournament status')
      }
      
      // Update local state
      setTournament(prev => prev ? { ...prev, status: newStatus } : null)
      setStatusMessage(`Tournament status updated to ${getStatusText(newStatus)}`)
      
      // Clear message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000)
      
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // New status management functions for admins
  const openStatusModal = () => {
    setShowStatusModal(true)
  }

  const closeStatusModal = () => {
    setShowStatusModal(false)
    setSelectedNewStatus('')
  }

  const handleStatusChange = (newStatus: string) => {
    setSelectedNewStatus(newStatus)
    setShowStatusConfirmation(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedNewStatus || !tournament) return
    
    setIsUpdatingStatus(true)
    setStatusMessage('')
    setShowStatusConfirmation(false)
    setShowStatusModal(false)
    
    try {
      console.log('Updating tournament status:', {
        tournamentId: tournament.id,
        newStatus: selectedNewStatus,
        currentStatus: tournament.status
      })
      
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser)
        },
        body: JSON.stringify({ status: selectedNewStatus })
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update tournament status`)
      }
      
      const result = await response.json()
      console.log('Success response:', result)
      
      // Update local state
      setTournament(prev => prev ? { ...prev, status: selectedNewStatus } : null)
      setStatusMessage(`Tournament status updated to ${statusDisplayNames[selectedNewStatus as keyof typeof statusDisplayNames]}`)
      
      // Clear message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000)
      
    } catch (error: any) {
      console.error('Status update error:', error)
      setStatusMessage(`Error: ${error.message}`)
    } finally {
      setIsUpdatingStatus(false)
      setSelectedNewStatus('')
    }
  }

  const cancelStatusChange = () => {
    setShowStatusConfirmation(false)
    setSelectedNewStatus('')
  }

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft':
        return [
          { value: 'registration_open', label: 'Open Registration', color: 'bg-green-600 hover:bg-green-700' }
        ]
      case 'registration_open':
        return [
          { value: 'registration_closed', label: 'Close Registration', color: 'bg-red-600 hover:bg-red-700' }
        ]
      case 'registration_closed':
        return [
          { value: 'auction_started', label: 'Start Auction', color: 'bg-blue-600 hover:bg-blue-700' }
        ]
      case 'auction_started':
        return [
          { value: 'auction_completed', label: 'Complete Auction', color: 'bg-purple-600 hover:bg-purple-700' }
        ]
      default:
        return []
    }
  }

  const fetchSlots = async (isRealtimeUpdate = false) => {
    try {
      if (isRealtimeUpdate) {
        setIsRealtimeUpdating(true)
      } else {
        setSlotsLoading(true)
      }
      
      const sessionUser = sessionManager.getUser()
      
      // Prepare headers - include authorization if user is authenticated
      const headers: any = {}
      if (sessionUser) {
        headers['Authorization'] = JSON.stringify(sessionUser)
      }

      const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        headers,
      })
      if (slotsResponse.ok) {
        const slotsResult = await slotsResponse.json()
        if (slotsResult.success) {
          setSlots(slotsResult.slots)
          setSlotsStats(slotsResult.stats)
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    } finally {
      if (isRealtimeUpdate) {
        // Add a small delay for visual feedback
        setTimeout(() => setIsRealtimeUpdating(false), 500)
      } else {
        setSlotsLoading(false)
      }
    }
  }

  const checkUserRegistration = async () => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) return

      // First check if user has a player profile
      const playerResponse = await fetch(`/api/player-profile`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })

      const playerResult = await playerResponse.json()
      if (!playerResult.success || !playerResult.profile) {
        // User doesn't have a player profile, no need to check registration
        setUserRegistration(null)
        return
      }

      // User has a player profile, now check registration status
      const response = await fetch(`/api/tournaments/${tournamentId}/user-registration`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })

      const result = await response.json()
      if (result.success && result.registration) {
        setUserRegistration(result.registration)
      } else {
        setUserRegistration(null)
      }
    } catch (error) {
      console.error('Error checking user registration:', error)
      setUserRegistration(null)
    }
  }

  // No promotion logic needed - positions are calculated dynamically in frontend

  // No waitlist status needed - positions calculated dynamically

  // No manual promotion needed - positions calculated dynamically

  const registerForTournament = async () => {
    // Check if registrations are open
    if (!tournament || tournament.status !== 'registration_open') {
      setRegistrationMessage('Registration is not currently open for this tournament.')
      return
    }

    setIsRegistering(true)
    setRegistrationMessage('')
    
    const maxRetries = 3
    const baseDelay = 1000 // Base delay in milliseconds
    let lastError = null

    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Registration attempt ${attempt}/${maxRetries}`)
          
          if (attempt > 1) {
            setRegistrationMessage(`Retrying registration (attempt ${attempt}/${maxRetries})...`)
          }
          
          const sessionUser = sessionManager.getUser()
          const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': JSON.stringify(sessionUser),
            },
          })

          const result = await response.json()
          
          if (!result.success) {
            if (result.error.includes('Player profile not found')) {
              setRegistrationMessage('Please create a player profile first before registering for tournaments.')
              return
            } else if (result.error.includes('Slot number already taken') || result.error.includes('already registered')) {
              // These are not retryable errors
              throw new Error(result.error)
            } else if (result.error.includes('Failed to register after multiple attempts')) {
              // Server-side retry failed, but we can try again
              if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
                console.log(`Server retry failed, client retrying in ${delay}ms...`)
                setRegistrationMessage(`Registration failed, retrying in ${Math.ceil(delay/1000)}s...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
              } else {
                throw new Error(result.error)
              }
            } else {
              throw new Error(result.error)
            }
          }

          // Success!
          console.log('Registration successful:', result)
          setRegistrationMessage(result.message)
          
          // Refresh slots data and user registration status
          await Promise.all([
            fetchSlots(),
            checkUserRegistration()
          ])
          
          return // Exit the retry loop on success
          
        } catch (err: any) {
          console.error(`Registration attempt ${attempt} failed:`, err)
          lastError = err
          
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
            console.log(`Registration failed, retrying in ${delay}ms...`)
            setRegistrationMessage(`Registration failed, retrying in ${Math.ceil(delay/1000)}s...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      // If we get here, all retries failed
      console.error('All registration attempts failed')
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Registration failed. Please try again.'
      if (lastError?.message) {
        if (lastError.message.includes('Registration is not currently open')) {
          errorMessage = 'Registration is no longer open for this tournament.'
        } else if (lastError.message.includes('Tournament is full')) {
          errorMessage = 'Tournament is full. You have been added to the waitlist.'
        } else if (lastError.message.includes('Already registered')) {
          errorMessage = 'You are already registered for this tournament.'
        } else if (lastError.message.includes('User not authenticated')) {
          errorMessage = 'Please sign in to register for tournaments.'
        } else {
          errorMessage = `Registration failed: ${lastError.message}`
        }
      }
      
      setRegistrationMessage(errorMessage)
    } finally {
      setIsRegistering(false);
      setTimeout(() => setRegistrationMessage(''), 10000); // Clear message after 10 seconds for retry messages
    }
  }

  const withdrawFromTournament = async () => {
    setIsWithdrawing(true)
    setRegistrationMessage('')
    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      setRegistrationMessage(result.message)
      // Refresh slots data and user registration status
      await Promise.all([
        fetchSlots(),
        checkUserRegistration()
      ])
    } catch (err: any) {
      console.error('Error withdrawing from tournament:', err)
      setRegistrationMessage(`Error: ${err.message}`)
    } finally {
      setIsWithdrawing(false)
      setTimeout(() => setRegistrationMessage(''), 5000) // Clear message after 5 seconds
    }
  }

  const removePlayerFromSlot = async (slotId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to remove ${playerName} from this tournament slot?`)) {
      return
    }

    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/remove-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
        body: JSON.stringify({ slotId })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      setRegistrationMessage(`Successfully removed ${playerName} from tournament`)
      // Refresh slots
      await fetchSlots()
    } catch (error: any) {
      console.error('Error removing player from tournament:', error)
      setRegistrationMessage(`Error: ${error.message}`)
    } finally {
      setTimeout(() => setRegistrationMessage(''), 5000) // Clear message after 5 seconds
    }
  }

  const cancelRegistration = async () => {
    setIsRegistering(true)
    setRegistrationMessage('')
    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      setRegistrationMessage(result.message)
      // Refresh slots data
      const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })
      if (slotsResponse.ok) {
        const slotsResult = await slotsResponse.json()
        if (slotsResult.success) {
          setSlots(slotsResult.slots)
          setSlotsStats(slotsResult.stats)
        }
      }
    } catch (err: any) {
      console.error('Error cancelling registration:', err)
      setRegistrationMessage(`Error: ${err.message}`)
    } finally {
      setIsRegistering(false)
      setTimeout(() => setRegistrationMessage(''), 5000) // Clear message after 5 seconds
    }
  }

  const approveSlot = async (slotId: string) => {
    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
        body: JSON.stringify({ slotId, action: 'approve' }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      // Refresh slots data
      const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })
      if (slotsResponse.ok) {
        const slotsResult = await slotsResponse.json()
        if (slotsResult.success) {
          setSlots(slotsResult.slots)
          setSlotsStats(slotsResult.stats)
        }
      }
    } catch (err: any) {
      console.error('Error approving slot:', err)
    }
  }

  const rejectSlot = async (slotId: string) => {
    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
        body: JSON.stringify({ slotId, action: 'reject' }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      // Refresh slots data
      const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })
      if (slotsResponse.ok) {
        const slotsResult = await slotsResponse.json()
        if (slotsResult.success) {
          setSlots(slotsResult.slots)
          setSlotsStats(slotsResult.stats)
        }
      }
    } catch (err: any) {
      console.error('Error rejecting slot:', err)
    }
  }

  // Component render logic
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#19171b] flex items-center justify-center py-4 sm:py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-[#CEA17A] mx-auto mb-4"></div>
          <p className="text-lg sm:text-xl text-[#DBD0C0]">Loading tournament...</p>
        </div>
      </div>
    )
  }


  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#19171b] flex items-center justify-center py-4 sm:py-8">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#3E4E5A] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#DBD0C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#DBD0C0] mb-4">Tournament Not Found</h1>
          <p className="text-[#DBD0C0] mb-6 text-sm sm:text-base">{error || 'The tournament you are looking for does not exist.'}</p>
          <Link
            href="/tournaments"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-[#CEA17A] text-[#09171F] rounded-lg hover:bg-[#DBD0C0] transition-colors text-sm sm:text-base font-semibold"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tournaments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
      <div className="absolute inset-0" 
           style={{
             background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
           }}></div>
      {/* Enhanced Background Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(117,2,15,0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-30"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(117,2,15,0.05)_60deg,transparent_120deg)] opacity-60"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(117,2,15,0.02)_50%,transparent_75%)] bg-[length:40px_40px] opacity-20"></div>
      
      {/* Sharp Geometric Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(206,161,122,0.03)_50%,transparent_60%)] bg-[length:60px_60px] opacity-25"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(117,2,15,0.04)_0%,transparent_70%)] opacity-30"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_25%_25%,transparent_0deg,rgba(206,161,122,0.02)_90deg,transparent_180deg)] opacity-20"></div>
      
      {/* Animated Grid Lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      {/* Background Glowing Orbs - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#75020f]/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-[#51080d]/4 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#2b0307]/5 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#CEA17A]/2 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/2 left-1/2 w-56 h-56 bg-[#75020f]/3 rounded-full blur-md animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      {/* Sharp Geometric Elements - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-[#CEA17A]/6 rotate-45 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-[#75020f]/8 rotate-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-[#51080d]/7 rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-5 h-5 bg-[#2b0307]/9 rotate-12 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-[#CEA17A]/5 rotate-45 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-2/3 left-1/5 w-3 h-3 bg-[#75020f]/6 rotate-12 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/3 right-1/5 w-5 h-5 bg-[#51080d]/8 rotate-45 animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-[#2b0307]/7 rotate-12 animate-pulse" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-[#CEA17A]/4 rotate-45 animate-pulse" style={{animationDelay: '3.5s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-3 h-3 bg-[#75020f]/5 rotate-12 animate-pulse" style={{animationDelay: '1.2s'}}></div>
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* Main Content - Reorganized Layout */}
        <div className="space-y-8">
          {/* Sign In Card for Unauthenticated Users */}
          {!user && !isHost && (
            <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#CEA17A]/30">
              {/* Luxury Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-2xl"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#8B0000]/30 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#DBD0C0] mb-2">
                      Ready to Join?
                    </h3>
                    <p className="text-[#DBD0C0] text-sm sm:text-base leading-relaxed">
                      Sign in to register for this tournament and secure your spot in the competition.
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href={`/signin?returnUrl=${encodeURIComponent(`/tournaments/${tournament.id}`)}`}
                  className="group relative flex-1 inline-flex items-center justify-center px-6 py-4 bg-green-500/20 text-green-300 border border-green-500/30 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 hover:bg-green-500/30 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:ring-offset-2 focus:ring-offset-transparent shadow-sm"
                >
                    <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In to Register</span>
                  </Link>
                  <Link
                    href="/tournaments"
                    className="group flex-1 inline-flex items-center justify-center px-6 py-4 bg-[#3E4E5A] text-[#DBD0C0] border border-[#CEA17A]/30 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 hover:bg-[#3E4E5A]/80 hover:border-[#CEA17A]/50 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#CEA17A]/40 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Browse Tournaments</span>
                  </Link>
                </div>
                
                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-[#CEA17A]/20">
                  <p className="text-[#DBD0C0] text-xs sm:text-sm text-center">
                    New to Phoenix Force? <span className="text-[#CEA17A] font-medium">Create a free account</span> to get started
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tournament Slots - Now at the top for better focus */}
          {tournament && (
            <div className="space-y-6">

              {/* Slots Display */}
              <div className="space-y-4">
                {/* Tournament Overview Label */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#DBD0C0]">Tournament Overview</h2>
                </div>
                
                {/* Comprehensive Tournament Overview */}
                <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-4 sm:p-6 mb-6">
                  {/* Tournament Name and Status Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-[#DBD0C0] mb-2">{tournament.name}</h3>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium shadow-sm ${getStatusColor(tournament.status)}`}>
                          {getStatusText(tournament.status)}
                        </span>
                    </div>
                    
                    {/* Register Now Button for Players */}
                    {!isHost && user && (
                      <div className="mt-4 sm:mt-0">
                        {userRegistration ? (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <h4 className="text-sm font-semibold text-green-900">Registered</h4>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Slot #{userRegistration.position || 'Calculating...'}
                              </span>
                            </div>
                            <div className="text-xs text-blue-700">
                              <span className={userRegistration.status === 'pending' ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium'}>
                                {userRegistration.status === 'pending' ? 'Awaiting Payment Confirmation' : 'Payment Verified'}
                              </span>
                            </div>
                            <button
                              onClick={withdrawFromTournament}
                              disabled={isWithdrawing}
                              className="mt-2 w-full px-3 py-1.5 bg-red-600 text-[#DBD0C0] rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                              {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={registerForTournament}
                            disabled={isRegistering || tournament.status !== 'registration_open'}
                            className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-md ${
                              tournament.status === 'registration_open' 
                                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-[#DBD0C0] hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {isRegistering ? (
                              <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Registering...
                              </div>
                            ) : tournament.status === 'registration_open' ? (
                              'Register Now'
                            ) : tournament.status === 'draft' ? (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Registration Not Open Yet
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Registration Closed
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tournament Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Format</label>
                      <div className="text-sm font-semibold text-[#DBD0C0]">{tournament.format}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tournament Date</label>
                      <div className="text-sm font-semibold text-[#DBD0C0]">
                        {new Date(tournament.tournament_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })} at {new Date(tournament.tournament_date).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Host</label>
                      <div className="text-sm font-semibold text-[#DBD0C0]">
                        {hostInfo?.firstname && hostInfo?.lastname 
                          ? `${hostInfo.firstname} ${hostInfo.lastname}`
                          : hostInfo?.username || hostInfo?.email || 'Unknown'
                        }
                      </div>
                    </div>
                    
                    {tournament.venue && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Venue</label>
                        <div className="text-sm font-semibold text-[#DBD0C0]">
                          {tournament.venue}
                          {tournament.google_maps_link && (
                            <div className="mt-1">
                              <a 
                                href={tournament.google_maps_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-xs"
                              >
                                view in Google Maps
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  {slotsStats && (
                    <div className="mt-6 pt-6 border-t border-[#CEA17A]/20">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Total Slots Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-4 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150 h-32">
                          {/* Luxury Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                          
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-[#DBD0C0]">{slotsStats.total_slots}</div>
                              <div className="text-sm font-medium text-[#DBD0C0]">Total Slots</div>
                              <div className="text-xs text-green-400">
                                {slotsStats.total_slots - slotsStats.filled_main_slots} available
                              </div>
                            </div>
                            <div className="w-10 h-10 bg-[#CEA17A]/20 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#DBD0C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Filled Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-4 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150 h-32">
                          {/* Luxury Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                          
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-[#DBD0C0]">{slotsStats.filled_main_slots}</div>
                              <div className="text-sm font-medium text-[#DBD0C0]">Filled</div>
                              <div className="text-xs text-blue-400">
                                {slotsStats.total_slots > 0 ? Math.round((slotsStats.filled_main_slots / slotsStats.total_slots) * 100) : 0}% filled
                              </div>
                            </div>
                            <div className="w-10 h-10 bg-[#CEA17A]/20 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#DBD0C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Waitlist Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-4 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150 h-32">
                          {/* Luxury Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                          
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-[#DBD0C0]">{slotsStats.filled_waitlist_slots}</div>
                              <div className="text-sm font-medium text-[#DBD0C0]">Waitlist</div>
                              <div className="text-xs text-orange-400">
                                {slotsStats.filled_waitlist_slots}
                              </div>
                            </div>
                            <div className="w-10 h-10 bg-[#CEA17A]/20 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#DBD0C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Pending Approval Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-4 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150 h-32">
                          {/* Luxury Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                          
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-[#DBD0C0]">{slotsStats.pending_approvals}</div>
                              <div className="text-sm font-medium text-[#DBD0C0]">Pending Approval</div>
                              <div className="text-xs text-yellow-400">
                                Awaiting Payment
                              </div>
                            </div>
                            <div className="w-10 h-10 bg-[#CEA17A]/20 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#DBD0C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Created At */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</label>
                        <div className="text-sm font-semibold text-[#DBD0C0]">
                          {new Date(tournament.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }).replace(',', '')}
                        </div>
                      </div>
                      
                      {/* Host Actions */}
                      {isHost && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={() => setShowAssignModal(true)}
                            className="w-full sm:flex-1 px-3 py-1.5 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 text-xs font-medium whitespace-nowrap"
                          >
                            Register Player
                          </button>
                          {/* Status Management - Admin gets full control, Host gets bidirectional */}
                          {isAdmin(userProfile) ? (
                            <button
                              onClick={openStatusModal}
                              disabled={isUpdatingStatus}
                              className="w-full sm:flex-1 px-3 py-1.5 bg-green-500/15 text-green-300 border border-green-500/25 shadow-lg shadow-green-500/10 backdrop-blur-sm rounded-lg hover:bg-green-500/25 hover:border-green-500/40 transition-all duration-150 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {isUpdatingStatus ? 'Updating...' : 'Manage Status'}
                            </button>
                          ) : (
                            // Host status management (bidirectional)
                            tournament && getAvailableTransitions(tournament.status).map((status) => {
                              const isForward = statusFlow[tournament.status as keyof typeof statusFlow]?.[0] === status
                              const isBackward = statusFlow[tournament.status as keyof typeof statusFlow]?.slice(1).includes(status)
                              
                              return (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(status)}
                                  disabled={isUpdatingStatus}
                                  className={`w-full sm:flex-1 px-3 py-1.5 rounded-lg transition-all duration-150 text-xs font-medium backdrop-blur-sm border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                                    isForward 
                                      ? 'bg-green-500/15 text-green-300 border-green-500/25 shadow-lg shadow-green-500/10 hover:bg-green-500/25 hover:border-green-500/40' 
                                      : isBackward 
                                        ? 'bg-orange-500/15 text-orange-300 border-orange-500/25 shadow-lg shadow-orange-500/10 hover:bg-orange-500/25 hover:border-orange-500/40'
                                        : 'bg-gray-500/15 text-gray-300 border-gray-500/25 shadow-lg shadow-gray-500/10 hover:bg-gray-500/25 hover:border-gray-500/40'
                                  }`}
                                >
                                  {isUpdatingStatus ? 'Updating...' : 
                                   isForward ? `→ ${statusDisplayNames[status as keyof typeof statusDisplayNames]}` :
                                   isBackward ? `← ${statusDisplayNames[status as keyof typeof statusDisplayNames]}` :
                                   statusDisplayNames[status as keyof typeof statusDisplayNames]}
                                </button>
                              )
                            })
                          )}
                          <Link
                            href={`/tournaments/${tournament.id}/edit`}
                            className="w-full sm:flex-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md text-center whitespace-nowrap"
                          >
                            Edit
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Show message if no slots are available (should not happen with intelligent slots) */}
                {slots.length === 0 && user && (
                  <div className="text-center py-4">
                    <p className="text-[#DBD0C0] mb-4">No tournament slots available</p>
                    <button
                      onClick={() => fetchSlots()}
                      className="px-4 py-2 bg-gray-600 text-[#DBD0C0] rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Refresh Slots
                    </button>
                  </div>
                )}

                {/* Playing Roster - Modern List View */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold text-[#DBD0C0]">
                        Playing Squad
                      </h3>
                      {isRealtimeUpdating && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {slots.filter(slot => slot.is_main_slot && slot.players).length}/{tournament.total_slots} filled
                    </div>
                  </div>
                  
                  {slotsLoading ? (
                    <SlotsSkeleton />
                  ) : (
                    <div className={`bg-[#09171F]/50 rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
                      isRealtimeUpdating 
                        ? 'border-blue-300 shadow-blue-100' 
                        : 'border-[#CEA17A]/20'
                    }`}>
                      {/* Header - Hidden on mobile, shown on desktop */}
                      <div className="hidden md:block bg-[#3E4E5A] px-6 py-4 border-b border-[#CEA17A]/20">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-[#DBD0C0]">
                          <div className="col-span-1">#</div>
                          <div className="col-span-4">Player Name</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-3">Joined</div>
                          {isHost && <div className="col-span-2">Actions</div>}
                        </div>
                      </div>
                      
                      {/* Playing Roster List */}
                      <div className="divide-y divide-gray-200">
                        {slots.filter(slot => slot.is_main_slot && slot.players).map((slot, index) => (
                          <div key={slot.id} className={`px-4 md:px-6 py-4 transition-colors ${
                            isCurrentUserSlot(slot) 
                              ? 'bg-blue-50 border-l-4 border-blue-400 hover:bg-blue-100' 
                              : 'hover:bg-[#51080d]'
                          }`}>
                            {/* Mobile Layout */}
                            <div className="md:hidden">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                                    {slot.position || index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium text-[#DBD0C0]">
                                      {slot.players.users?.firstname && slot.players.users?.lastname 
                                        ? `${slot.players.users.firstname} ${slot.players.users.lastname}`
                                        : slot.players.users?.username || slot.players.users?.email || slot.players.name
                                      }
                                    </div>
                                    <div className="text-sm text-[#DBD0C0]">{slot.players.display_name}</div>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  slot.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {slot.status === 'confirmed' ? 'Approved' : 'Awaiting'}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm text-[#DBD0C0]">
                                  <div>Joined: {formatDateTime(slot.requested_at)}</div>
                                  {slot.confirmed_at && (
                                    <div className="text-xs text-gray-500">
                                      Payment Verified: {formatDateTime(slot.confirmed_at)}
                                    </div>
                                  )}
                                </div>
                                {isHost && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {slot.status === 'pending' ? (
                                      <>
                                        <button
                                          onClick={() => approveSlot(slot.id)}
                                          className="px-2.5 py-1.5 bg-green-500/15 text-green-300 border border-green-500/25 shadow-lg shadow-green-500/10 backdrop-blur-sm rounded-md hover:bg-green-500/25 hover:border-green-500/40 transition-all duration-150 text-xs font-medium flex-1 min-w-0"
                                        >
                                          ✓ Approve
                                        </button>
                                        <button
                                          onClick={() => rejectSlot(slot.id)}
                                          className="px-2.5 py-1.5 bg-red-500/15 text-red-300 border border-red-500/25 shadow-lg shadow-red-500/10 backdrop-blur-sm rounded-md hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-150 text-xs font-medium flex-1 min-w-0"
                                        >
                                          ✗ Reject
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => removePlayerFromSlot(slot.id, slot.players?.display_name || 'Player')}
                                        className="px-2.5 py-1.5 bg-red-500/15 text-red-300 border border-red-500/25 shadow-lg shadow-red-500/10 backdrop-blur-sm rounded-md hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-150 text-xs font-medium w-full"
                                      >
                                        🗑️ Remove
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Desktop Layout */}
                            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-1">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                                  {slot.position || index + 1}
                                </div>
                              </div>
                              <div className="col-span-4">
                                <div className="font-medium text-[#DBD0C0]">
                                  {slot.players.users?.firstname && slot.players.users?.lastname 
                                    ? `${slot.players.users.firstname} ${slot.players.users.lastname}`
                                    : slot.players.users?.username || slot.players.users?.email || slot.players.name
                                  }
                                </div>
                                <div className="text-sm text-[#DBD0C0]">{slot.players.display_name}</div>
                              </div>
                              <div className="col-span-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  slot.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {slot.status === 'confirmed' ? 'Payment Verified' : 'Awaiting Payment Confirmation'}
                                </span>
                              </div>
                              <div className="col-span-3">
                                <div className="text-sm text-[#DBD0C0]">
                                  {formatDateTime(slot.requested_at)}
                                </div>
                                {slot.confirmed_at && (
                                  <div className="text-xs text-gray-500">
                                    Payment Verified: {formatDateTime(slot.confirmed_at)}
                                  </div>
                                )}
                              </div>
                              {isHost && (
                                <div className="col-span-2">
                                  {slot.status === 'pending' ? (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => approveSlot(slot.id)}
                                        className="px-3 py-1 bg-green-500/15 text-green-300 border border-green-500/25 shadow-lg shadow-green-500/10 backdrop-blur-sm rounded-lg hover:bg-green-500/25 hover:border-green-500/40 transition-all duration-150 text-xs font-medium"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => rejectSlot(slot.id)}
                                        className="px-3 py-1 bg-red-500/15 text-red-300 border border-red-500/25 shadow-lg shadow-red-500/10 backdrop-blur-sm rounded-lg hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-150 text-xs font-medium"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => removePlayerFromSlot(slot.id, slot.players?.display_name || 'Player')}
                                      className="px-3 py-1 bg-red-500/15 text-red-300 border border-red-500/25 shadow-lg shadow-red-500/10 backdrop-blur-sm rounded-lg hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-150 text-xs font-medium"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Empty slots */}
                        {Array.from({ length: Math.max(0, tournament.total_slots - slots.filter(slot => slot.is_main_slot && slot.players).length) }).map((_, index) => {
                          const slotNumber = slots.filter(slot => slot.is_main_slot && slot.players).length + index + 1
                          return (
                            <div key={`empty-${slotNumber}`} className="px-4 md:px-6 py-4 text-gray-400">
                              {/* Mobile Layout */}
                              <div className="md:hidden">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-400">
                                      {slotNumber}
                                    </div>
                                    <div className="text-sm text-green-400">Available slot</div>
                                  </div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                    Empty
                                  </span>
                                </div>
                              </div>
                              
                              {/* Desktop Layout */}
                              <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-1">
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-400">
                                    {slotNumber}
                                  </div>
                                </div>
                                <div className="col-span-4">
                                  <div className="text-sm text-green-400">Available slot</div>
                                </div>
                                <div className="col-span-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                    Empty
                                  </span>
                                </div>
                                <div className="col-span-3">
                                  <div className="text-sm">-</div>
                                </div>
                                {isHost && <div className="col-span-2"></div>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Waitlist - Modern List View */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold text-[#DBD0C0]">Waitlist</h3>
                      {isRealtimeUpdating && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {slots.filter(slot => !slot.is_main_slot && slot.players).length} players waiting
                    </div>
                  </div>
                  
                  {slotsLoading ? (
                    <SlotsSkeleton />
                  ) : (
                    <div className={`bg-[#09171F]/50 rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
                      isRealtimeUpdating 
                        ? 'border-blue-300 shadow-blue-100' 
                        : 'border-[#CEA17A]/20'
                    }`}>
                      {/* Header - Hidden on mobile, shown on desktop */}
                      <div className="hidden md:block bg-[#3E4E5A] px-6 py-4 border-b border-[#CEA17A]/20">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-[#DBD0C0]">
                          <div className="col-span-1">#</div>
                          <div className="col-span-4">Player Name</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-3">Joined</div>
                          {isHost && <div className="col-span-2">Actions</div>}
                        </div>
                      </div>
                      
                      {/* Waitlist */}
                      <div className="divide-y divide-gray-200">
                        {slots.filter(slot => !slot.is_main_slot && slot.players).map((slot, index) => (
                          <div key={slot.id} className={`px-4 md:px-6 py-4 transition-colors ${
                            isCurrentUserSlot(slot) 
                              ? 'bg-blue-50 border-l-4 border-blue-400 hover:bg-blue-100' 
                              : 'hover:bg-[#51080d]'
                          }`}>
                            {/* Mobile Layout */}
                            <div className="md:hidden">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                                    {slot.waitlist_position || index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium text-[#DBD0C0]">
                                      {slot.players.users?.firstname && slot.players.users?.lastname 
                                        ? `${slot.players.users.firstname} ${slot.players.users.lastname}`
                                        : slot.players.users?.username || slot.players.users?.email || slot.players.name
                                      }
                                    </div>
                                    <div className="text-sm text-[#DBD0C0]">{slot.players.display_name}</div>
                                  </div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Awaiting
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm text-[#DBD0C0]">
                                  Joined: {formatDateTime(slot.requested_at)}
                                </div>
                                {isHost && (
                                  <button
                                    onClick={() => removePlayerFromSlot(slot.id, slot.players?.display_name || 'Player')}
                                    className="px-2.5 py-1.5 bg-red-600 text-[#DBD0C0] text-xs rounded-md hover:bg-red-700 transition-colors w-full"
                                  >
                                    🗑️ Remove
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Desktop Layout */}
                            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-1">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                                  {slot.waitlist_position || index + 1}
                                </div>
                              </div>
                              <div className="col-span-4">
                                <div className="font-medium text-[#DBD0C0]">
                                  {slot.players.users?.firstname && slot.players.users?.lastname 
                                    ? `${slot.players.users.firstname} ${slot.players.users.lastname}`
                                    : slot.players.users?.username || slot.players.users?.email || slot.players.name
                                  }
                                </div>
                                <div className="text-sm text-[#DBD0C0]">{slot.players.display_name}</div>
                              </div>
                              <div className="col-span-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Waitlist
                                </span>
                              </div>
                              <div className="col-span-3">
                                <div className="text-sm text-[#DBD0C0]">
                                  {formatDateTime(slot.requested_at)}
                                </div>
                              </div>
                              {isHost && (
                                <div className="col-span-2">
                                  <button
                                    onClick={() => removePlayerFromSlot(slot.id, slot.players?.display_name || 'Player')}
                                    className="px-3 py-1 bg-red-600 text-[#DBD0C0] text-xs rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* No waitlist message */}
                        {slots.filter(slot => !slot.is_main_slot && slot.players).length === 0 && (
                          <div className="px-4 md:px-6 py-8 text-center text-gray-500">
                            <div className="text-lg font-medium mb-2">No waitlist</div>
                            <div className="text-sm">All main tournament slots are available</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tournament Timeline - Full Width */}
          <div className="bg-[#09171F]/50 rounded-xl shadow-sm border border-[#CEA17A]/20 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-[#DBD0C0] mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <div className="text-sm font-medium text-[#DBD0C0]">Tournament Created</div>
                  <div className="text-xs text-gray-500">
                    {new Date(tournament.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  tournament.status === 'registration_open' || 
                  tournament.status === 'registration_closed' || 
                  tournament.status === 'auction_started' || 
                  tournament.status === 'auction_completed' 
                    ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <div className="text-sm font-medium text-[#DBD0C0]">Registration Opens</div>
                  <div className="text-xs text-gray-500">When ready</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  tournament.status === 'auction_started' || 
                  tournament.status === 'auction_completed' 
                    ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <div className="text-sm font-medium text-[#DBD0C0]">Auction Begins</div>
                  <div className="text-xs text-gray-500">After registration</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  tournament.status === 'auction_completed' 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <div className="text-sm font-medium text-[#DBD0C0]">Tournament Complete</div>
                  <div className="text-xs text-gray-500">Final results</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Player Assignment Modal */}
      {showAssignModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="relative overflow-hidden bg-[#19171b] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-500 scale-100 border border-[#CEA17A]/30 animate-slide-up">
            {/* Dark Blue Palette Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#3E4E5A]/5 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#3E4E5A]/30 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-2xl"></div>
            {/* Content */}
            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-[#DBD0C0]">Register Players to Tournament</h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedPlayers([])
                    setSearchTerm('')
                    setAllPlayers([])
                    setFilteredPlayers([])
                    setSelectedSkill('')
                    setSelectedSkillValue('')
                    setAssignStatus('pending')
                  }}
                  className="text-gray-400 hover:text-[#DBD0C0] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-4 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150 mb-6">
                {/* Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                
                <div className="relative z-10">
                <div className="space-y-4">
                  {/* Search - Full width on mobile */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-[#DBD0C0] mb-2">Search Players</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type player name to search..."
                      className="w-full px-3 py-2.5 bg-[#09171F] border border-[#CEA17A]/30 rounded-lg text-[#DBD0C0] placeholder-gray-400 focus:ring-2 focus:ring-[#CEA17A] focus:border-[#CEA17A]"
                    />
                  </div>
                  
                  {/* Add Filter on Skills Button - Full width on mobile */}
                  <div className="w-full">
                    <button
                      onClick={() => setShowSkillConfig(!showSkillConfig)}
                      className="w-full px-4 py-2.5 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 text-sm font-medium"
                    >
                      {showSkillConfig ? 'Clear Skills Filter' : 'Add Filter on Skills'}
                    </button>
                  </div>
                </div>
                </div>
              </div>

              {/* Skills Filter Section */}
              {showSkillConfig && (
                <div className="bg-[#09171F]/50 rounded-lg p-3 border border-[#CEA17A]/20 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-[#DBD0C0]">Select Skills to Filter By</h4>
                    <button
                      onClick={() => setShowSkillConfig(false)}
                      className="text-gray-400 hover:text-[#DBD0C0]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                    {availableSkills.map((skill) => (
                      <label key={skill.id} className="flex items-center space-x-2 p-2 border border-[#CEA17A]/20 rounded hover:bg-[#3E4E5A] cursor-pointer text-[#DBD0C0]">
                        <input
                          type="checkbox"
                          checked={enabledSkills.includes(skill.id)}
                          onChange={() => toggleSkillEnabled(skill.id)}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-xs text-[#DBD0C0]">{skill.name}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEnabledSkills([])}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setEnabledSkills(availableSkills.map(s => s.id))}
                      className="px-2 py-1 text-xs text-[#DBD0C0] hover:text-[#CEA17A]"
                    >
                      Select All
                    </button>
                  </div>
                </div>
              )}

              {/* Active Skills Filter */}
              {enabledSkills.length > 0 && (
                <div className="bg-gradient-to-r from-[#3E4E5A] to-[#09171F] rounded-xl p-4 border border-[#CEA17A]/20 mb-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#CEA17A] rounded-full"></div>
                      <h4 className="text-sm font-semibold text-[#DBD0C0]">Active Filters</h4>
                    </div>
                    <button
                      onClick={clearAllSkillFilters}
                      className="text-xs text-[#DBD0C0] hover:text-[#CEA17A] font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {enabledSkills.map((skillId) => {
                      const skill = availableSkills.find(s => s.id === skillId)
                      if (!skill) return null
                      
                      return (
                        <div key={skillId} className="bg-[#09171F]/50 rounded-lg p-3 border border-[#CEA17A]/20 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-[#DBD0C0] uppercase tracking-wide">
                              {skill.name}
                            </label>
                            <button
                              onClick={() => clearSkillFilter(skillId)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                          
                          {skill.type === 'select' ? (
                            <select
                              value={skillFilterValues[skillId]?.[0] || ''}
                              onChange={(e) => updateSkillFilterValue(skillId, e.target.value ? [e.target.value] : [])}
                              className="w-full px-2 py-1.5 border border-[#CEA17A]/30 rounded-md focus:ring-1 focus:ring-[#CEA17A] focus:border-[#CEA17A] text-xs bg-[#09171F] text-[#DBD0C0]"
                            >
                              <option value="">All {skill.name}</option>
                              {skill.values?.map((value: any) => (
                                <option key={value.id} value={value.id}>
                                  {value.name}
                                </option>
                              ))}
                            </select>
                          ) : skill.type === 'multiselect' ? (
                            <div className="space-y-2">
                              <div className="max-h-24 overflow-y-auto border border-[#CEA17A]/20 rounded-md bg-[#09171F]">
                                {skill.values?.map((value: any) => {
                                  const isSelected = skillFilterValues[skillId]?.includes(value.id) || false
                                  return (
                                    <label key={value.id} className="flex items-center space-x-2 px-2 py-1 hover:bg-[#3E4E5A] cursor-pointer text-[#DBD0C0]">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const currentValues = skillFilterValues[skillId] || []
                                          const newValues = e.target.checked
                                            ? [...currentValues, value.id]
                                            : currentValues.filter((v: string) => v !== value.id)
                                          updateSkillFilterValue(skillId, newValues)
                                        }}
                                        className="h-3 w-3 text-[#DBD0C0] focus:ring-gray-500 border-gray-300 rounded"
                                      />
                                      <span className="text-xs text-[#DBD0C0]">{value.name}</span>
                                    </label>
                                  )
                                })}
                              </div>
                              {skillFilterValues[skillId]?.length > 0 && (
                                <div className="text-xs text-[#DBD0C0]">
                                  {skillFilterValues[skillId].length} selected
                                </div>
                              )}
                            </div>
                          ) : skill.type === 'number' ? (
                            <div className="flex space-x-1">
                              <input
                                type="number"
                                placeholder="Min"
                                value={skillFilterValues[skillId]?.[0] || ''}
                                onChange={(e) => {
                                  const values = [...(skillFilterValues[skillId] || ['', ''])]
                                  values[0] = e.target.value
                                  updateSkillFilterValue(skillId, values)
                                }}
                                className="w-full px-2 py-1.5 border border-[#CEA17A]/30 rounded-md focus:ring-1 focus:ring-[#CEA17A] focus:border-[#CEA17A] text-xs bg-[#09171F] text-[#DBD0C0]"
                              />
                              <input
                                type="number"
                                placeholder="Max"
                                value={skillFilterValues[skillId]?.[1] || ''}
                                onChange={(e) => {
                                  const values = [...(skillFilterValues[skillId] || ['', ''])]
                                  values[1] = e.target.value
                                  updateSkillFilterValue(skillId, values)
                                }}
                                className="w-full px-2 py-1.5 border border-[#CEA17A]/30 rounded-md focus:ring-1 focus:ring-[#CEA17A] focus:border-[#CEA17A] text-xs bg-[#09171F] text-[#DBD0C0]"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={skillFilterValues[skillId]?.[0] || ''}
                              onChange={(e) => updateSkillFilterValue(skillId, e.target.value ? [e.target.value] : [])}
                              placeholder={`Filter by ${skill.name.toLowerCase()}...`}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-xs bg-[#51080d]"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Selection Summary */}
              {selectedPlayers.length > 0 && (
                <div className="mb-4 relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-4 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
                  {/* Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#DBD0C0]">
                        {selectedPlayers.length} player(s) selected
                      </div>
                      <div className="text-xs text-[#DBD0C0]">
                        {selectedPlayers.map(p => p.display_name).join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={clearAllSelections}
                      className="text-xs bg-red-500/15 text-red-300 border border-red-500/25 shadow-lg shadow-red-500/10 backdrop-blur-sm rounded px-2 py-1 hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-150 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {/* Players List */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <h4 className="text-sm font-medium text-[#DBD0C0]">
                    Available Players ({filteredPlayers.filter(p => !p.isRegistered).length})
                  </h4>
                  
                  {/* Hide Assigned Players Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hideAssigned"
                      checked={hideAssignedPlayers}
                      onChange={(e) => setHideAssignedPlayers(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hideAssigned" className="text-sm font-medium text-[#DBD0C0]">
                      Hide Assigned Players
                    </label>
                  </div>
                </div>
                
                <div className="max-h-48 sm:max-h-64 overflow-y-auto relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
                  {/* Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                  
                  <div className="relative z-10">
                  {/* Table-like Header Row */}
                  <div className="p-2 sm:p-3 bg-[#3E4E5A] border-b border-[#CEA17A]/20">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <input
                        type="checkbox"
                        checked={filteredPlayers.filter(p => !p.isRegistered).length > 0 && 
                                filteredPlayers.filter(p => !p.isRegistered).every(p => 
                                  selectedPlayers.some(selected => selected.id === p.id)
                                )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllPlayers()
                          } else {
                            setSelectedPlayers([])
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#DBD0C0]">
                          Select All Available Players
                        </div>
                      </div>
                    </div>
                  </div>
                  {isLoadingPlayers ? (
                    <div className="p-4 text-center text-[#DBD0C0]">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading players...
                    </div>
                  ) : filteredPlayers.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredPlayers.map((player) => {
                        const isSelected = selectedPlayers.some(p => p.id === player.id)
                        const isRegistered = player.isRegistered
                        
                        return (
                          <div
                            key={player.id}
                            className={`p-2 sm:p-3 transition-colors ${
                              isRegistered 
                                ? 'bg-[#09171F] opacity-60 cursor-not-allowed' 
                                : 'hover:bg-[#3E4E5A] cursor-pointer'
                            }`}
                            onClick={() => !isRegistered && togglePlayerSelection(player)}
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isRegistered}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  if (!isRegistered) togglePlayerSelection(player)
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-[#DBD0C0]">
                                  <div className="truncate">{player.display_name}</div>
                                  {isRegistered && (
                                    <span className="inline-block mt-1 text-xs bg-[#CEA17A] text-[#09171F] px-2 py-1 rounded-full">
                                      Already Registered
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs sm:text-sm text-[#DBD0C0]">
                                  {player.user ? (
                                    player.user.firstname && player.user.lastname 
                                      ? `${player.user.firstname} ${player.user.lastname}` 
                                      : player.user.username || player.user.email
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      <span className="text-yellow-500 text-xs">No user account linked</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[#DBD0C0]">
                      No players found matching the current filters
                    </div>
                  )}
                </div>
                  </div>
              </div>

              {/* Status Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#DBD0C0] mb-3">
                  Assignment Status
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center p-3 relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150 cursor-pointer">
                    {/* Luxury Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                    
                    <div className="relative z-10 flex items-center">
                      <input
                        type="radio"
                        value="pending"
                        checked={assignStatus === 'pending'}
                        onChange={(e) => setAssignStatus(e.target.value as 'pending' | 'confirmed')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-[#DBD0C0]">Pending</div>
                        <div className="text-xs text-[#DBD0C0]">Player needs approval</div>
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150 cursor-pointer">
                    {/* Luxury Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                    
                    <div className="relative z-10 flex items-center">
                      <input
                        type="radio"
                        value="confirmed"
                        checked={assignStatus === 'confirmed'}
                        onChange={(e) => setAssignStatus(e.target.value as 'pending' | 'confirmed')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-[#DBD0C0]">Payment Verified</div>
                        <div className="text-xs text-[#DBD0C0]">Player payment is verified</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedPlayers([])
                    setSearchTerm('')
                    setAllPlayers([])
                    setFilteredPlayers([])
                    setSelectedSkill('')
                    setSelectedSkillValue('')
                    setAssignStatus('pending')
                    setHideAssignedPlayers(false)
                    setShowFilterPanel(false)
                    setActiveFilters({
                      search: true,
                      skills: false,
                      hideAssigned: false
                    })
                    setMultipleSkillFilters([])
                  }}
                  className="w-full sm:flex-1 px-4 py-2 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={assignPlayers}
                  disabled={selectedPlayers.length === 0 || isAssigning}
                  className="w-full sm:flex-1 px-4 py-2 bg-green-500/15 text-green-300 border border-green-500/25 shadow-lg shadow-green-500/10 backdrop-blur-sm rounded-lg hover:bg-green-500/25 hover:border-green-500/40 transition-all duration-150 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Registering...
                    </div>
                  ) : (
                    `Register ${selectedPlayers.length} Player(s) as ${assignStatus === 'confirmed' ? 'Payment Verified' : 'Pending'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Status Management Modal - Only for Admins */}
      {showStatusModal && isAdmin(userProfile) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#09171F] rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#CEA17A]/30">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#DBD0C0]">Status Management</h3>
                <button
                  onClick={closeStatusModal}
                  className="text-gray-400 hover:text-[#DBD0C0] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-[#DBD0C0] mb-2">Current Status:</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(tournament?.status || '')}`}>
                    {getStatusText(tournament?.status || '')}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-[#DBD0C0] mb-3">All Tournament Statuses:</p>
                <div className="space-y-2">
                  {Object.keys(statusDisplayNames)
                    .filter(status => !['auction_started', 'auction_completed', 'teams_formed'].includes(status))
                    .map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className="w-full text-left p-3 relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150"
                    >
                      {/* Luxury Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[#DBD0C0]">
                            {statusDisplayNames[status as keyof typeof statusDisplayNames]}
                          </div>
                          <div className={`text-xs flex items-center space-x-1 ${
                            status === tournament?.status ? 'text-[#DBD0C0]' : 
                            statusFlow[tournament?.status as keyof typeof statusFlow]?.includes(status) ? 'text-green-400' : 
                            'text-yellow-400'
                          }`}>
                            {status === tournament?.status ? 'Current Status' : 
                             statusFlow[tournament?.status as keyof typeof statusFlow]?.includes(status) ? 'Available Transition' : 
                             (
                               <>
                                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                 </svg>
                                 <span>Admin Override</span>
                               </>
                             )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {status === tournament?.status && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 text-xs rounded">Current</span>
                          )}
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeStatusModal}
                  className="flex-1 px-4 py-2 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Change Confirmation Dialog */}
      {showStatusConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#09171F] rounded-xl shadow-xl max-w-md w-full border border-[#CEA17A]/30">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#DBD0C0]">Status Change</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-[#DBD0C0] mb-3">
                  {isAdmin(userProfile) 
                    ? 'As an admin, you have full control over tournament status changes.'
                    : 'Are you sure you want to change the tournament status?'
                  }
                </p>
                <div className="bg-[#3E4E5A] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#DBD0C0]">From:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tournament?.status || '')}`}>
                      {getStatusText(tournament?.status || '')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-[#DBD0C0]">To:</span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/15 text-green-300 border border-green-500/25 shadow-lg shadow-green-500/10 backdrop-blur-sm">
                      {statusDisplayNames[selectedNewStatus as keyof typeof statusDisplayNames]}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {isAdmin(userProfile) 
                    ? 'Admin actions are logged and all data will be preserved.'
                    : 'This action will be logged and all data will be preserved.'
                  }
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={cancelStatusChange}
                  className="flex-1 px-4 py-2 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={isUpdatingStatus}
                  className="flex-1 px-4 py-2 bg-green-500/15 text-green-300 border border-green-500/25 shadow-lg shadow-green-500/10 backdrop-blur-sm rounded-lg hover:bg-green-500/25 hover:border-green-500/40 transition-all duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Confirm Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
