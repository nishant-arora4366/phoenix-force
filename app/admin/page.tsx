'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { secureSessionManager } from '@/src/lib/secure-session'
import { useRealtimeAnalytics } from '@/src/hooks/useRealtimeAnalytics'
import { API_ACCESS_CONFIG, APIAccessConfig, getAPIsByAccessType, getAPIsByRole, getAPIsByStatus } from '@/src/lib/api-access-config'

interface User {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
  status: string
  created_at: string
  updated_at: string
  player_profile?: {
    id: string
    display_name: string
    status: string
    created_at: string
  }
}

interface PlayerProfile {
  id: string
  user_id: string
  display_name: string
  bio?: string
  profile_pic_url?: string
  status: string
  created_at: string
  updated_at: string
  users?: {
    firstname?: string
    lastname?: string
    email: string
  }
}

interface PlayerSkill {
  id: string
  skill_name: string
  skill_type: string
  is_required: boolean
  display_order: number
  is_admin_managed: boolean
  viewer_can_see: boolean
  created_at: string
  updated_at: string
  values?: PlayerSkillValue[]
}

interface PlayerSkillValue {
  id: string
  skill_id: string
  value_name: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminPanel() {
  const router = useRouter()
  const { user: authUser, isSigningOut } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [playerProfiles, setPlayerProfiles] = useState<PlayerProfile[]>([])
  const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'players' | 'skills' | 'api-access' | 'analytics'>('users')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [isEditingSkill, setIsEditingSkill] = useState<string | null>(null)
  const [editingSkill, setEditingSkill] = useState({
    name: '',
    type: 'select',
    required: false,
    displayOrder: 0,
    isAdminManaged: false,
    viewerCanSee: true
  })
  const [editingValue, setEditingValue] = useState({
    skillId: '',
    valueId: '',
    valueName: '',
    displayOrder: 0
  })
  const [isEditingValue, setIsEditingValue] = useState<string | null>(null)
  const [isAddingValue, setIsAddingValue] = useState(false)
  const [newValue, setNewValue] = useState({
    skillId: '',
    valueName: '',
    displayOrder: 0
  })
  const [newSkill, setNewSkill] = useState({
    name: '',
    type: 'select',
    required: false,
    displayOrder: 0,
    isAdminManaged: false,
    viewerCanSee: true
  })
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const [apiAccessFilter, setApiAccessFilter] = useState<'all' | 'public' | 'authenticated' | 'role-based'>('all')
  const [apiStatusFilter, setApiStatusFilter] = useState<'all' | 'active' | 'deprecated' | 'planned'>('all')
  const [apiRoleFilter, setApiRoleFilter] = useState<'all' | 'admin' | 'host' | 'viewer'>('all')
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [userActivityData, setUserActivityData] = useState<any>(null)
  const [usagePatternsData, setUsagePatternsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  
  // Real-time analytics
  const { data: realtimeData, isLoading: realtimeLoading, isConnected } = useRealtimeAnalytics()

  // User CRUD state
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    firstname: '',
    lastname: '',
    username: '',
    role: 'viewer',
    status: 'pending'
  })
  const [isLinkingPlayer, setIsLinkingPlayer] = useState(false)
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null)
  const [linkingPlayerId, setLinkingPlayerId] = useState<string | null>(null)
  const [isLinkingUser, setIsLinkingUser] = useState(false)
  const [linkingPlayerIdForUser, setLinkingPlayerIdForUser] = useState<string | null>(null)
  const [linkingUserIdForPlayer, setLinkingUserIdForPlayer] = useState<string | null>(null)
  const [playerSearchTerm, setPlayerSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userLinkPage, setUserLinkPage] = useState(1)
  const [playerLinkPage, setPlayerLinkPage] = useState(1)
  const usersPerPage = 10
  const playersPerPage = 10
  // Pagination for main tables
  const [userTablePage, setUserTablePage] = useState(1)
  const [playerTablePage, setPlayerTablePage] = useState(1)
  const usersPerTablePage = 10
  const playersPerTablePage = 10
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [allPlayers, setAllPlayers] = useState<any[]>([]) // For linking dropdown
  
  // Base Price modal states
  const [showBasePriceModal, setShowBasePriceModal] = useState(false)
  const [playerToApprove, setPlayerToApprove] = useState<string | null>(null)
  const [availableBasePrices, setAvailableBasePrices] = useState<string[]>([])
  const [selectedBasePrice, setSelectedBasePrice] = useState('')
  const [isLoadingBasePrices, setIsLoadingBasePrices] = useState(false)


  useEffect(() => {
    const getUser = async () => {
      // Skip error messages during sign-out
      if (isSigningOut) {
        setLoading(false)
        return
      }
      
      const currentUser = secureSessionManager.getUser()
      setUser(currentUser)
      
      if (currentUser) {
        // Check if user is admin
        if (currentUser.role === 'admin') {
          // Load all users for admin panel
          await loadUsers()
          await loadAllPlayers() // Load all players for linking dropdowns
        } else {
          setMessage('Access denied. Admin role required.')
        }
      }
      
      setLoading(false)
    }
    getUser()

    const unsubscribe = secureSessionManager.subscribe((userData) => {
      // Skip updates during sign-out to prevent flashing errors
      if (isSigningOut) {
        return
      }
      
      setUser(userData)
      // Only update loading state, don't set error messages during subscription updates
      // This prevents "Access denied" from flashing when user signs out
      if (userData && userData.role !== 'admin' && message !== 'Access denied. Admin role required.') {
        setMessage('Access denied. Admin role required.')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [message, isSigningOut])

  // Fetch player profiles when tab changes to players
  useEffect(() => {
    if (activeTab === 'players' && user) {
      fetchPlayerProfiles()
    }
  }, [activeTab, user])

  // Fetch player skills when tab changes to skills
  useEffect(() => {
    if (activeTab === 'skills' && user) {
      fetchPlayerSkills()
    }
  }, [activeTab, user])

  // Fetch analytics data when tab changes to analytics
  useEffect(() => {
    if (activeTab === 'analytics' && user) {
      fetchAnalyticsData()
    }
  }, [activeTab, user, analyticsPeriod])

  const loadUsers = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.users || [])
      } else {
        throw new Error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setMessage('Error loading users')
    }
  }

  const fetchPlayerProfiles = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/player-profiles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch player profiles')
      }
      
      const { success, profiles } = await response.json()
      
      if (success) {
        console.log('Fetched player profiles:', profiles)
        setPlayerProfiles(profiles || [])
      } else {
        throw new Error('Failed to fetch player profiles')
      }
    } catch (error: any) {
      console.error('Error fetching player profiles:', error)
      setMessage('Error loading player profiles')
    }
  }

  const fetchPlayerSkills = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/player-skills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch player skills')
      }
      
      const { success, skills } = await response.json()
      
      if (success) {
        setPlayerSkills(skills || [])
      } else {
        throw new Error('Failed to fetch player skills')
      }
    } catch (error: any) {
      console.error('Error fetching player skills:', error)
      setMessage('Error loading player skills')
    }
  }

  const searchUser = async () => {
    if (!searchEmail) return
    
    try {
      const response = await fetch(`/api/update-user-role?email=${encodeURIComponent(searchEmail)}`)
      const result = await response.json()
      
      if (result.success) {
        setSelectedUser(result.data)
        setNewRole(result.data.role)
      } else {
        setMessage(`User not found: ${result.error}`)
      }
    } catch (error) {
      setMessage('Error searching for user')
    }
  }

  const updateUserRole = async () => {
    if (!selectedUser || !newRole) return
    
    try {
      const response = await fetch('/api/update-user-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newRole: newRole
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage(`User role updated to ${newRole}`)
        setSelectedUser(result.data)
        await loadUsers() // Refresh the list
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('Error updating user role')
    }
  }

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, status })
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      const { success } = await response.json()
      
      if (success) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status } : user
        ))

        setMessage(`User ${status === 'approved' ? 'approved' : 'rejected'} successfully`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error('Failed to update user status')
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const updateUserRoleFromTable = async (userId: string, role: string) => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role })
      })

      if (!response.ok) {
        throw new Error('Failed to update user role')
      }

      const { success } = await response.json()
      
      if (success) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role } : user
        ))

        setMessage(`User role updated to ${role}`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error('Failed to update user role')
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const resetUserPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to reset the password for ${userEmail}? The new password will be their email address.`)) {
      return
    }

    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Failed to reset password')
      }

      const { success, message } = await response.json()
      
      if (success) {
        setMessage(`Password reset successfully. New password is: ${userEmail}`)
        setTimeout(() => setMessage(''), 5000) // Show for 5 seconds since it contains the password
      } else {
        throw new Error('Failed to reset password')
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const createUser = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const { success, user: createdUser } = await response.json()
      
      if (success) {
        await loadUsers() // Reload users list
        setSuccessMessage(`User ${newUser.email} created successfully!`)
        setShowSuccessMessage(true)
        setIsCreatingUser(false)
        // Reset form
        setNewUser({
          email: '',
          firstname: '',
          lastname: '',
          username: '',
          role: 'viewer',
          status: 'pending'
        })
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const updateUser = async () => {
    try {
      if (!editingUser) return

      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: editingUser.id,
          role: editingUser.role,
          status: editingUser.status,
          firstname: editingUser.firstname,
          lastname: editingUser.lastname,
          username: editingUser.username
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      const { success } = await response.json()
      
      if (success) {
        await loadUsers() // Reload users list
        setSuccessMessage('User updated successfully!')
        setShowSuccessMessage(true)
        setIsEditingUser(false)
        setEditingUser(null)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      const { success } = await response.json()
      
      if (success) {
        await loadUsers() // Reload users list
        setSuccessMessage('User deleted successfully!')
        setShowSuccessMessage(true)
        setShowDeleteConfirm(false)
        setDeletingUserId(null)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const linkPlayerToUser = async (userId: string, playerId: string) => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, playerId, action: 'link' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link player to user')
      }

      const { success } = await response.json()
      
      if (success) {
        await loadUsers() // Reload users list
        await fetchPlayerProfiles() // Reload player profiles list
        setSuccessMessage('Player linked to user successfully!')
        setShowSuccessMessage(true)
        setIsLinkingPlayer(false)
        setLinkingUserId(null)
        setLinkingPlayerId(null)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const unlinkPlayerFromUser = async (userId: string) => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, action: 'unlink' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unlink player from user')
      }

      const { success } = await response.json()
      
      if (success) {
        await loadUsers() // Reload users list
        await fetchPlayerProfiles() // Reload player profiles list
        setSuccessMessage('Player unlinked from user successfully!')
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const linkUserToPlayer = async (playerId: string, userId: string) => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/player-profiles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ playerId, userId, action: 'link' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link user to player')
      }

      const { success } = await response.json()
      
      if (success) {
        await loadUsers() // Reload users list
        await fetchPlayerProfiles() // Reload player profiles list
        setSuccessMessage('User linked to player successfully!')
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const unlinkUserFromPlayer = async (playerId: string) => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/player-profiles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ playerId, action: 'unlink' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unlink user from player')
      }

      const { success } = await response.json()
      
      if (success) {
        await loadUsers() // Reload users list
        await fetchPlayerProfiles() // Reload player profiles list
        setSuccessMessage('User unlinked from player successfully!')
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const loadAllPlayers = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        return
      }

      const response = await fetch('/api/players-public', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAllPlayers(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  // Function to fetch available Base Price values
  const fetchBasePriceValues = async () => {
    setIsLoadingBasePrices(true)
    try {
      const token = secureSessionManager.getToken()
      const response = await fetch('/api/player-skills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.skills) {
          const basePriceSkill = result.skills.find((skill: any) => skill.skill_name === 'Base Price')
          if (basePriceSkill && basePriceSkill.values) {
            const basePrices = basePriceSkill.values.map((value: any) => value.value_name)
            setAvailableBasePrices(basePrices)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching base price values:', error)
    } finally {
      setIsLoadingBasePrices(false)
    }
  }

  const performStatusUpdate = async (playerId: string, status: string, basePrice?: string) => {
    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const requestBody: any = {
        playerId,
        status
      }

      // If approving and base price is provided, include it
      if (status === 'approved' && basePrice) {
        requestBody.basePrice = basePrice
      }
      
      const response = await fetch(`/api/admin/player-profiles?userId=${sessionUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update player profile status')
      }

      const { success } = await response.json()

      if (success) {
        // Update local state
        setPlayerProfiles(prev => prev.map(profile => 
          profile.id === playerId ? { ...profile, status } : profile
        ))

        setMessage(`Player profile ${status === 'approved' ? 'approved' : 'rejected'} successfully`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error('Failed to update player profile status')
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const handleApproveWithBasePrice = async () => {
    if (!playerToApprove || !selectedBasePrice) {
      setMessage('Please select a base price')
      return
    }

    await performStatusUpdate(playerToApprove, 'approved', selectedBasePrice)
    setShowBasePriceModal(false)
    setPlayerToApprove(null)
    setSelectedBasePrice('')
  }

  const updatePlayerProfileStatus = async (playerId: string, status: string) => {
    if (status === 'approved') {
      // Show Base Price modal for approval
      setPlayerToApprove(playerId)
      setSelectedBasePrice('')
      
      // Fetch base price values first
      await fetchBasePriceValues()
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        setShowBasePriceModal(true)
      }, 100)
    } else {
      // Direct rejection without Base Price
      await performStatusUpdate(playerId, status)
    }
  }

  const addPlayerSkill = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/player-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          skill: newSkill
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add player skill')
      }

      const { success } = await response.json()

      if (success) {
        setMessage('Player skill added successfully!')
        fetchPlayerSkills() // Refresh the list
        setIsAddingSkill(false)
        setNewSkill({ name: '', type: 'select', required: false, displayOrder: 0, isAdminManaged: false, viewerCanSee: true })
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error('Failed to add player skill')
      }
    } catch (error: any) {
      console.error('Error adding player skill:', error)
      setMessage(`Error: ${error.message}`)
    }
  }

  const editPlayerSkill = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/player-skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          skillId: isEditingSkill,
          skill: editingSkill
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update player skill')
      }

      const result = await response.json()
      if (result.success) {
        setMessage('Player skill updated successfully')
        setIsEditingSkill(null)
        setEditingSkill({ name: '', type: 'select', required: false, displayOrder: 0, isAdminManaged: false, viewerCanSee: true })
        fetchPlayerSkills()
      } else {
        throw new Error(result.error || 'Failed to update player skill')
      }
    } catch (error: any) {
      console.error('Error updating player skill:', error)
      setMessage(`Error: ${error.message}`)
    }
  }

  const deletePlayerSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
      return
    }

    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/player-skills', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          skillId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to delete player skill')
      }

      const { success } = await response.json()

      if (success) {
        setMessage('Player skill deleted successfully!')
        fetchPlayerSkills() // Refresh the list
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error('Failed to delete player skill')
      }
    } catch (error: any) {
      console.error('Error deleting player skill:', error)
      setMessage(`Error: ${error.message}`)
    }
  }

  const addSkillValue = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/player-skill-values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          skillId: newValue.skillId,
          valueName: newValue.valueName,
          displayOrder: newValue.displayOrder
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add skill value')
      }

      const result = await response.json()
      if (result.success) {
        setMessage('Skill value added successfully!')
        setIsAddingValue(false)
        setNewValue({ skillId: '', valueName: '', displayOrder: 0 })
        fetchPlayerSkills()
      } else {
        throw new Error(result.error || 'Failed to add skill value')
      }
    } catch (error: any) {
      console.error('Error adding skill value:', error)
      setMessage(`Error: ${error.message}`)
    }
  }

  const editSkillValue = async () => {
    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/player-skill-values', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          valueId: editingValue.valueId,
          valueName: editingValue.valueName,
          displayOrder: editingValue.displayOrder
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update skill value')
      }

      const result = await response.json()
      if (result.success) {
        setMessage('Skill value updated successfully!')
        setIsEditingValue(null)
        setEditingValue({ skillId: '', valueId: '', valueName: '', displayOrder: 0 })
        fetchPlayerSkills()
      } else {
        throw new Error(result.error || 'Failed to update skill value')
      }
    } catch (error: any) {
      console.error('Error updating skill value:', error)
      setMessage(`Error: ${error.message}`)
    }
  }

  const deleteSkillValue = async (valueId: string) => {
    if (!confirm('Are you sure you want to delete this skill value? This action cannot be undone.')) {
      return
    }

    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const token = secureSessionManager.getToken()
      
      if (!sessionUser || !token) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/admin/player-skill-values', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          valueId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to delete skill value')
      }

      const result = await response.json()
      if (result.success) {
        setMessage('Skill value deleted successfully')
        fetchPlayerSkills()
      } else {
        throw new Error(result.error || 'Failed to delete skill value')
      }
    } catch (error: any) {
      console.error('Error deleting skill value:', error)
      setMessage(`Error: ${error.message}`)
    }
  }

  const toggleSkillExpansion = (skillId: string) => {
    const newExpanded = new Set(expandedSkills)
    if (newExpanded.has(skillId)) {
      newExpanded.delete(skillId)
    } else {
      newExpanded.add(skillId)
    }
    setExpandedSkills(newExpanded)
  }

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true)
    try {
      const sessionUser = secureSessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      // Calculate date range based on period
      const now = new Date()
      const days = analyticsPeriod === '7d' ? 7 : analyticsPeriod === '30d' ? 30 : 90
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = now.toISOString().split('T')[0]

      // Get authentication token
      const token = secureSessionManager.getToken()
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      // Fetch all analytics data in parallel
      const [usageResponse, usersResponse, patternsResponse] = await Promise.all([
        fetch(`/api/analytics/usage?startDate=${startDateStr}&endDate=${endDateStr}`, { headers }),
        fetch(`/api/analytics/users?startDate=${startDateStr}&endDate=${endDateStr}`, { headers }),
        fetch(`/api/analytics/patterns?startDate=${startDateStr}&endDate=${endDateStr}`, { headers })
      ])

      const [usageData, usersData, patternsData] = await Promise.all([
        usageResponse.json(),
        usersResponse.json(),
        patternsResponse.json()
      ])

      if (usageData.success) {
        setAnalyticsData(usageData.data)
      }
      if (usersData.success) {
        setUserActivityData(usersData.data)
      }
      if (patternsData.success) {
        setUsagePatternsData(patternsData.data)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setMessage('Error loading analytics data')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-[#DBD0C0] mb-2">Loading...</h2>
                <p className="text-[#CEA17A]">Fetching admin panel data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-[#DBD0C0] mb-6">
                  Please Sign In
                </h1>
                <p className="text-xl text-[#CEA17A] mb-8">
                  You need to be signed in to access the admin panel.
                </p>
                <Link
                  href="/signin?returnUrl=/admin"
                  className="inline-block px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (message === 'Access denied. Admin role required.' && user && user.role !== 'admin') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-[#DBD0C0] mb-6">
                  Access Denied
                </h1>
                <p className="text-xl text-[#CEA17A] mb-8">
                  You need admin privileges to access this page.
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
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
      
      {/* Content */}
      <div className="relative z-10 py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#DBD0C0] mb-6 sm:mb-8">Admin Panel</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.includes('Error') 
                ? 'bg-[#75020f]/15 text-[#75020f] border-[#75020f]/25'
                : 'bg-[#3E4E5A]/15 text-[#CEA17A] border-[#CEA17A]/25'
            }`}>
              {message}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-[#CEA17A]/20 mb-6">
            {/* Desktop Tab Navigation */}
            <nav className="hidden sm:flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-[#CEA17A] text-[#CEA17A]'
                    : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('players')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'players'
                    ? 'border-[#CEA17A] text-[#CEA17A]'
                    : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                }`}
              >
                Player Management
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'skills'
                    ? 'border-[#CEA17A] text-[#CEA17A]'
                    : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                }`}
              >
                Skill Management
              </button>
              <button
                onClick={() => setActiveTab('api-access')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'api-access'
                    ? 'border-[#CEA17A] text-[#CEA17A]'
                    : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                }`}
              >
                API Access Control
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-[#CEA17A] text-[#CEA17A]'
                    : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                }`}
              >
                API Analytics
              </button>
            </nav>

            {/* Mobile Tab Navigation - Horizontal Scroll */}
            <div className="sm:hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <nav className="flex space-x-4 min-w-max px-1">
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                      activeTab === 'users'
                        ? 'border-[#CEA17A] text-[#CEA17A]'
                        : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Users
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('players')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                      activeTab === 'players'
                        ? 'border-[#CEA17A] text-[#CEA17A]'
                        : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Players
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                      activeTab === 'skills'
                        ? 'border-[#CEA17A] text-[#CEA17A]'
                        : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Skills
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('api-access')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                      activeTab === 'api-access'
                        ? 'border-[#CEA17A] text-[#CEA17A]'
                        : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      API Access
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                      activeTab === 'analytics'
                        ? 'border-[#CEA17A] text-[#CEA17A]'
                        : 'border-transparent text-[#DBD0C0] hover:text-[#CEA17A] hover:border-[#CEA17A]/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analytics
                    </span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <>
              {/* Search User Section */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-[#DBD0C0] mb-4">Update User Role</h2>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter user email"
                    className="flex-1 px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                  />
                  <button
                    onClick={searchUser}
                    className="w-full sm:w-auto px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    Search
                  </button>
                </div>

                {selectedUser && (
                  <div className="mt-4 p-4 bg-[#3E4E5A]/15 border border-[#CEA17A]/25 rounded-lg">
                    <h3 className="font-semibold text-[#DBD0C0] mb-2">User Found:</h3>
                    <p className="text-[#DBD0C0]"><strong>Name:</strong> {selectedUser.firstname} {selectedUser.lastname}</p>
                    <p className="text-[#DBD0C0]"><strong>Email:</strong> {selectedUser.email}</p>
                    <p className="text-[#DBD0C0]"><strong>Current Role:</strong> {selectedUser.role}</p>
                    
                    <div className="mt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="host">Host</option>
                        <option value="captain">Captain</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={updateUserRole}
                        className="w-full sm:w-auto px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                      >
                        Update Role
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setFilter('all')
                      setUserTablePage(1)
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === 'all'
                        ? 'bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
                        : 'bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 hover:bg-[#3E4E5A]/25'
                    }`}
                  >
                    All Users
                  </button>
                  <button
                    onClick={() => {
                      setFilter('pending')
                      setUserTablePage(1)
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === 'pending'
                        ? 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
                        : 'bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 hover:bg-[#3E4E5A]/25'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => {
                      setFilter('approved')
                      setUserTablePage(1)
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === 'approved'
                        ? 'bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
                        : 'bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 hover:bg-[#3E4E5A]/25'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => {
                      setFilter('rejected')
                      setUserTablePage(1)
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === 'rejected'
                        ? 'bg-[#75020f]/25 text-[#75020f] border border-[#75020f]/40'
                        : 'bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 hover:bg-[#3E4E5A]/25'
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>

              {/* All Users List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#DBD0C0]">All Users</h2>
                  <button
                    onClick={() => setIsCreatingUser(true)}
                    className="px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    ➕ Create User
                  </button>
                </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#CEA17A]/20">
                  <thead className="bg-[#3E4E5A]/15">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                        Player Profile
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#09171F]/50 divide-y divide-[#CEA17A]/20">
                      {(() => {
                        const filteredUsers = users.filter(user => filter === 'all' || user.status === filter)
                        const totalPages = Math.ceil(filteredUsers.length / usersPerTablePage)
                        const startIndex = (userTablePage - 1) * usersPerTablePage
                        const endIndex = startIndex + usersPerTablePage
                        const paginatedUsers = filteredUsers.slice(startIndex, endIndex)
                        
                        return paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-[#3E4E5A]/10 transition-colors">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                            {user.firstname} {user.lastname}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                            {user.email}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRoleFromTable(user.id, e.target.value)}
                              className="text-sm bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded px-2 py-1 focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="host">Host</option>
                              <option value="captain">Captain</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'approved' ? 'bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/40' :
                              user.status === 'pending' ? 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40' :
                              user.status === 'rejected' ? 'bg-[#75020f]/25 text-[#75020f] border border-[#75020f]/40' :
                              'bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/40'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                            {user.player_profile ? (
                              <div className="flex items-center space-x-2">
                                <span>{user.player_profile.display_name}</span>
                                <button
                                  onClick={() => unlinkPlayerFromUser(user.id)}
                                  className="text-[#75020f] hover:text-[#75020f]/80"
                                  title="Unlink Player"
                                >
                                  🔗❌
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setLinkingUserId(user.id)
                                  setIsLinkingPlayer(true)
                                  setPlayerSearchTerm('')
                                }}
                                className="text-[#CEA17A] hover:text-[#CEA17A]/80 text-xs underline"
                              >
                                Link Player
                              </button>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {user.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateUserStatus(user.id, 'approved')}
                                  className="text-[#CEA17A] hover:text-[#CEA17A]/80 bg-[#3E4E5A]/15 border border-[#CEA17A]/25 px-2 py-1 rounded text-xs hover:bg-[#3E4E5A]/25 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateUserStatus(user.id, 'rejected')}
                                  className="text-[#75020f] hover:text-[#75020f]/80 bg-[#75020f]/15 border border-[#75020f]/25 px-2 py-1 rounded text-xs hover:bg-[#75020f]/25 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => resetUserPassword(user.id, user.email)}
                              className="text-[#CEA17A] hover:text-[#CEA17A]/80 bg-[#3E4E5A]/15 border border-[#CEA17A]/25 px-2 py-1 rounded text-xs hover:bg-[#3E4E5A]/25 transition-colors"
                            >
                              Reset Pass
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(user)
                                setIsEditingUser(true)
                              }}
                              className="text-[#CEA17A] hover:text-[#CEA17A]/80 bg-[#3E4E5A]/15 border border-[#CEA17A]/25 px-2 py-1 rounded text-xs hover:bg-[#3E4E5A]/25 transition-colors"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeletingUserId(user.id)
                                setShowDeleteConfirm(true)
                              }}
                              className="text-[#75020f] hover:text-[#75020f]/80 bg-[#75020f]/15 border border-[#75020f]/25 px-2 py-1 rounded text-xs hover:bg-[#75020f]/25 transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-[#CEA17A]">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {/* User Table Pagination */}
                {(() => {
                  const filteredUsers = users.filter(user => filter === 'all' || user.status === filter)
                  const totalPages = Math.ceil(filteredUsers.length / usersPerTablePage)
                  
                  if (totalPages <= 1) return null
                  
                  return (
                    <div className="mt-4 flex items-center justify-between px-2">
                      <div className="text-sm text-[#CEA17A]/60">
                        Showing {((userTablePage - 1) * usersPerTablePage) + 1} to {Math.min(userTablePage * usersPerTablePage, filteredUsers.length)} of {filteredUsers.length} users
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setUserTablePage(prev => Math.max(1, prev - 1))}
                          disabled={userTablePage === 1}
                          className="px-4 py-2 text-sm bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          ← Previous
                        </button>
                        <div className="flex items-center px-4 py-2 text-sm text-[#DBD0C0] bg-[#3E4E5A]/15 border border-[#CEA17A]/25 rounded">
                          Page {userTablePage} of {totalPages}
                        </div>
                        <button
                          onClick={() => setUserTablePage(prev => Math.min(totalPages, prev + 1))}
                          disabled={userTablePage === totalPages}
                          className="px-4 py-2 text-sm bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Create User Modal */}
              {isCreatingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-gradient-to-br from-[#09171F] to-[#1a2332] border border-[#CEA17A]/30 rounded-xl shadow-2xl p-6 max-w-md w-full">
                    <h3 className="text-xl font-semibold text-[#CEA17A] mb-4">Create New User</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Email *</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                          placeholder="user@example.com"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-[#DBD0C0] mb-1">First Name</label>
                          <input
                            type="text"
                            value={newUser.firstname}
                            onChange={(e) => setNewUser({...newUser, firstname: e.target.value})}
                            className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Last Name</label>
                          <input
                            type="text"
                            value={newUser.lastname}
                            onChange={(e) => setNewUser({...newUser, lastname: e.target.value})}
                            className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Username</label>
                        <input
                          type="text"
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="host">Host</option>
                          <option value="captain">Captain</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Status</label>
                        <select
                          value={newUser.status}
                          onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setIsCreatingUser(false)}
                        className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createUser}
                        disabled={!newUser.email}
                        className="px-4 py-2 bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40 rounded-lg hover:bg-[#CEA17A]/35 disabled:opacity-50"
                      >
                        Create User
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit User Modal */}
              {isEditingUser && editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-gradient-to-br from-[#09171F] to-[#1a2332] border border-[#CEA17A]/30 rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-semibold text-[#CEA17A] mb-4">Edit User</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Email</label>
                        <input
                          type="email"
                          value={editingUser.email}
                          disabled
                          className="w-full px-3 py-2 bg-[#3E4E5A]/10 text-[#DBD0C0]/60 border border-[#CEA17A]/15 rounded-lg"
                        />
                        <p className="text-xs text-[#CEA17A]/60 mt-1">Email cannot be changed</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-[#DBD0C0] mb-1">First Name</label>
                          <input
                            type="text"
                            value={editingUser.firstname || ''}
                            onChange={(e) => setEditingUser({...editingUser, firstname: e.target.value})}
                            className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Last Name</label>
                          <input
                            type="text"
                            value={editingUser.lastname || ''}
                            onChange={(e) => setEditingUser({...editingUser, lastname: e.target.value})}
                            className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Username</label>
                        <input
                          type="text"
                          value={editingUser.username || ''}
                          onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Role</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="host">Host</option>
                          <option value="captain">Captain</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Status</label>
                        <select
                          value={editingUser.status}
                          onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setIsEditingUser(false)
                          setEditingUser(null)
                        }}
                        className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateUser}
                        className="px-4 py-2 bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40 rounded-lg hover:bg-[#CEA17A]/35"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Link Player Modal */}
              {isLinkingPlayer && linkingUserId && (() => {
                const filteredPlayers = allPlayers
                  .filter(p => !p.user_id || p.user_id === linkingUserId)
                  .filter(p => p.display_name.toLowerCase().includes(playerSearchTerm.toLowerCase()))
                  .sort((a, b) => a.display_name.localeCompare(b.display_name))
                
                const totalPages = Math.ceil(filteredPlayers.length / playersPerPage)
                const startIndex = (playerLinkPage - 1) * playersPerPage
                const endIndex = startIndex + playersPerPage
                const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex)
                
                return (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-[#09171F] to-[#1a2332] border border-[#CEA17A]/30 rounded-xl shadow-2xl p-6 max-w-md w-full">
                      <h3 className="text-xl font-semibold text-[#CEA17A] mb-4">Link Player to User</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Search Player</label>
                          <input
                            type="text"
                            value={playerSearchTerm}
                            onChange={(e) => {
                              setPlayerSearchTerm(e.target.value)
                              setPlayerLinkPage(1)
                            }}
                            placeholder="Search by player name..."
                            className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 placeholder-[#CEA17A]/40"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Select Player</label>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto bg-[#3E4E5A]/15 border border-[#CEA17A]/25 rounded-lg p-2">
                            {paginatedPlayers.length > 0 ? (
                              paginatedPlayers.map(player => (
                                <div
                                  key={player.id}
                                  onClick={() => setLinkingPlayerId(player.id)}
                                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                                    linkingPlayerId === player.id
                                      ? 'bg-[#CEA17A]/25 border border-[#CEA17A]/40'
                                      : 'bg-[#09171F]/50 border border-[#CEA17A]/15 hover:bg-[#3E4E5A]/25'
                                  }`}
                                >
                                  <div className="text-sm font-medium text-[#DBD0C0]">{player.display_name}</div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-[#CEA17A]/60 py-4">No players available</div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-[#CEA17A]/60">
                              {filteredPlayers.length} player(s) • Page {playerLinkPage} of {totalPages || 1}
                            </p>
                            {totalPages > 1 && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setPlayerLinkPage(prev => Math.max(1, prev - 1))}
                                  disabled={playerLinkPage === 1}
                                  className="px-3 py-1 text-xs bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  ← Prev
                                </button>
                                <button
                                  onClick={() => setPlayerLinkPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={playerLinkPage === totalPages}
                                  className="px-3 py-1 text-xs bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Next →
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setIsLinkingPlayer(false)
                            setLinkingUserId(null)
                            setLinkingPlayerId(null)
                            setPlayerSearchTerm('')
                            setPlayerLinkPage(1)
                          }}
                          className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => linkingPlayerId && linkPlayerToUser(linkingUserId, linkingPlayerId)}
                          disabled={!linkingPlayerId}
                          className="px-4 py-2 bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40 rounded-lg hover:bg-[#CEA17A]/35 disabled:opacity-50"
                        >
                          Link Player
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && deletingUserId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-gradient-to-br from-[#09171F] to-[#1a2332] border border-[#75020f]/30 rounded-xl shadow-2xl p-6 max-w-md w-full">
                    <h3 className="text-xl font-semibold text-[#75020f] mb-4">⚠️ Confirm Deletion</h3>
                    <p className="text-[#DBD0C0] mb-6">
                      Are you sure you want to delete this user? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeletingUserId(null)
                        }}
                        className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteUser(deletingUserId)}
                        className="px-4 py-2 bg-[#75020f]/25 text-[#75020f] border border-[#75020f]/40 rounded-lg hover:bg-[#75020f]/35"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message Modal */}
              {showSuccessMessage && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-gradient-to-br from-[#09171F] to-[#1a2332] border border-[#CEA17A]/30 rounded-xl shadow-2xl p-6 max-w-md w-full">
                    <div className="text-center">
                      <div className="text-4xl mb-3">✅</div>
                      <h3 className="text-xl font-semibold text-[#CEA17A] mb-2">Success!</h3>
                      <p className="text-[#DBD0C0]">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}

          {/* Players Tab Content */}
          {activeTab === 'players' && (
            <>
              {/* Player Profiles Table - Desktop */}
              <div className="hidden md:block bg-[#09171F]/50 rounded-lg shadow-sm border border-[#CEA17A]/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#CEA17A]/20">
                  <h3 className="text-lg font-medium text-[#DBD0C0]">Player Profiles</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#CEA17A]/20">
                    <thead className="bg-[#3E4E5A]/15">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                          Player Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#09171F]/50 divide-y divide-[#CEA17A]/20">
                      {(() => {
                        const totalPages = Math.ceil(playerProfiles.length / playersPerTablePage)
                        const startIndex = (playerTablePage - 1) * playersPerTablePage
                        const endIndex = startIndex + playersPerTablePage
                        const paginatedPlayers = playerProfiles.slice(startIndex, endIndex)
                        
                        return paginatedPlayers.map((profile) => (
                        <tr key={profile.id} className="hover:bg-[#3E4E5A]/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-[#DBD0C0]">
                              {profile.display_name}
                            </div>
                            {profile.bio && (
                              <div className="text-sm text-[#CEA17A] truncate max-w-xs">
                                {profile.bio}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                            {profile.users ? (
                              <div className="flex items-center space-x-2">
                                <div>
                                  <div className="font-medium">
                                    {profile.users.firstname} {profile.users.lastname}
                                  </div>
                                  <div className="text-[#CEA17A]">{profile.users.email}</div>
                                </div>
                                <button
                                  onClick={() => unlinkUserFromPlayer(profile.id)}
                                  className="text-[#75020f] hover:text-[#75020f]/80 text-xs"
                                  title="Unlink User"
                                >
                                  🔗❌
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setLinkingPlayerIdForUser(profile.id)
                                  setIsLinkingUser(true)
                                }}
                                className="text-[#CEA17A] hover:text-[#CEA17A]/80 text-xs underline"
                              >
                                Link User
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              profile.status === 'approved' ? 'bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/40' :
                              profile.status === 'pending' ? 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40' :
                              profile.status === 'rejected' ? 'bg-[#75020f]/25 text-[#75020f] border border-[#75020f]/40' :
                              'bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/40'
                            }`}>
                              {profile.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#CEA17A]">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {profile.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updatePlayerProfileStatus(profile.id, 'approved')}
                                  className="text-[#CEA17A] hover:text-[#CEA17A]/80 bg-[#3E4E5A]/15 border border-[#CEA17A]/25 px-2 py-1 rounded text-xs hover:bg-[#3E4E5A]/25 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updatePlayerProfileStatus(profile.id, 'rejected')}
                                  className="text-[#75020f] hover:text-[#75020f]/80 bg-[#75020f]/15 border border-[#75020f]/25 px-2 py-1 rounded text-xs hover:bg-[#75020f]/25 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {/* Player Table Pagination - Desktop */}
                {(() => {
                  const totalPages = Math.ceil(playerProfiles.length / playersPerTablePage)
                  
                  if (totalPages <= 1) return null
                  
                  return (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-[#CEA17A]/20">
                      <div className="text-sm text-[#CEA17A]/60">
                        Showing {((playerTablePage - 1) * playersPerTablePage) + 1} to {Math.min(playerTablePage * playersPerTablePage, playerProfiles.length)} of {playerProfiles.length} players
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPlayerTablePage(prev => Math.max(1, prev - 1))}
                          disabled={playerTablePage === 1}
                          className="px-4 py-2 text-sm bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          ← Previous
                        </button>
                        <div className="flex items-center px-4 py-2 text-sm text-[#DBD0C0] bg-[#3E4E5A]/15 border border-[#CEA17A]/25 rounded">
                          Page {playerTablePage} of {totalPages}
                        </div>
                        <button
                          onClick={() => setPlayerTablePage(prev => Math.min(totalPages, prev + 1))}
                          disabled={playerTablePage === totalPages}
                          className="px-4 py-2 text-sm bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Player Profiles - Mobile */}
              <div className="md:hidden space-y-4">
                {(() => {
                  const totalPages = Math.ceil(playerProfiles.length / playersPerTablePage)
                  const startIndex = (playerTablePage - 1) * playersPerTablePage
                  const endIndex = startIndex + playersPerTablePage
                  const paginatedPlayers = playerProfiles.slice(startIndex, endIndex)
                  
                  return paginatedPlayers.map((profile) => (
                  <div key={profile.id} className="bg-[#09171F]/50 rounded-lg shadow-sm border border-[#CEA17A]/20 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-[#DBD0C0]">
                          {profile.display_name}
                        </h3>
                        {profile.users && (
                          <p className="text-sm text-[#CEA17A]">
                            {profile.users.firstname} {profile.users.lastname}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        profile.status === 'approved' ? 'bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/40' :
                        profile.status === 'pending' ? 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40' :
                        profile.status === 'rejected' ? 'bg-[#75020f]/25 text-[#75020f] border border-[#75020f]/40' :
                        'bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/40'
                      }`}>
                        {profile.status}
                      </span>
                    </div>
                    
                    {profile.bio && (
                      <p className="text-sm text-[#CEA17A] mb-3">{profile.bio}</p>
                    )}
                    
                    {profile.users && (
                      <p className="text-sm text-[#CEA17A] mb-3">{profile.users.email}</p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#CEA17A]">
                        Created: {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                      {profile.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => updatePlayerProfileStatus(profile.id, 'approved')}
                            className="text-[#CEA17A] hover:text-[#CEA17A]/80 bg-[#3E4E5A]/15 border border-[#CEA17A]/25 px-2 py-1 rounded text-xs hover:bg-[#3E4E5A]/25 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updatePlayerProfileStatus(profile.id, 'rejected')}
                            className="text-[#75020f] hover:text-[#75020f]/80 bg-[#75020f]/15 border border-[#75020f]/25 px-2 py-1 rounded text-xs hover:bg-[#75020f]/25 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  ))
                })()}
                
                {/* Player Table Pagination - Mobile */}
                {(() => {
                  const totalPages = Math.ceil(playerProfiles.length / playersPerTablePage)
                  
                  if (totalPages <= 1) return null
                  
                  return (
                    <div className="mt-4 flex flex-col space-y-2">
                      <div className="text-sm text-center text-[#CEA17A]/60">
                        Showing {((playerTablePage - 1) * playersPerTablePage) + 1} to {Math.min(playerTablePage * playersPerTablePage, playerProfiles.length)} of {playerProfiles.length} players
                      </div>
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => setPlayerTablePage(prev => Math.max(1, prev - 1))}
                          disabled={playerTablePage === 1}
                          className="px-4 py-2 text-sm bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          ← Prev
                        </button>
                        <div className="flex items-center px-4 py-2 text-sm text-[#DBD0C0] bg-[#3E4E5A]/15 border border-[#CEA17A]/25 rounded">
                          {playerTablePage} / {totalPages}
                        </div>
                        <button
                          onClick={() => setPlayerTablePage(prev => Math.min(totalPages, prev + 1))}
                          disabled={playerTablePage === totalPages}
                          className="px-4 py-2 text-sm bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Link User to Player Modal */}
              {isLinkingUser && linkingPlayerIdForUser && (() => {
                const filteredUsers = users
                  .filter(u => !u.player_profile || u.player_profile.id === linkingPlayerIdForUser)
                  .filter(u => {
                    const searchLower = userSearchTerm.toLowerCase()
                    const fullName = `${u.firstname || ''} ${u.lastname || ''}`.toLowerCase()
                    const email = (u.email || '').toLowerCase()
                    return fullName.includes(searchLower) || email.includes(searchLower)
                  })
                  .sort((a, b) => {
                    const nameA = `${a.firstname || ''} ${a.lastname || ''}`.trim()
                    const nameB = `${b.firstname || ''} ${b.lastname || ''}`.trim()
                    return nameA.localeCompare(nameB)
                  })
                
                const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
                const startIndex = (userLinkPage - 1) * usersPerPage
                const endIndex = startIndex + usersPerPage
                const paginatedUsers = filteredUsers.slice(startIndex, endIndex)
                
                return (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-[#09171F] to-[#1a2332] border border-[#CEA17A]/30 rounded-xl shadow-2xl p-6 max-w-md w-full">
                      <h3 className="text-xl font-semibold text-[#CEA17A] mb-4">Link User to Player</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Search User</label>
                          <input
                            type="text"
                            value={userSearchTerm}
                            onChange={(e) => {
                              setUserSearchTerm(e.target.value)
                              setUserLinkPage(1)
                            }}
                            placeholder="Search by name or email..."
                            className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 placeholder-[#CEA17A]/40"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Select User</label>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto bg-[#3E4E5A]/15 border border-[#CEA17A]/25 rounded-lg p-2">
                            {paginatedUsers.length > 0 ? (
                              paginatedUsers.map(user => (
                                <div
                                  key={user.id}
                                  onClick={() => setLinkingUserIdForPlayer(user.id)}
                                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                                    linkingUserIdForPlayer === user.id
                                      ? 'bg-[#CEA17A]/25 border border-[#CEA17A]/40'
                                      : 'bg-[#09171F]/50 border border-[#CEA17A]/15 hover:bg-[#3E4E5A]/25'
                                  }`}
                                >
                                  <div className="text-sm font-medium text-[#DBD0C0]">
                                    {user.firstname} {user.lastname}
                                  </div>
                                  <div className="text-xs text-[#CEA17A]/60 mt-1">{user.email}</div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-[#CEA17A]/60 py-4">No users available</div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-[#CEA17A]/60">
                              {filteredUsers.length} user(s) • Page {userLinkPage} of {totalPages || 1}
                            </p>
                            {totalPages > 1 && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setUserLinkPage(prev => Math.max(1, prev - 1))}
                                  disabled={userLinkPage === 1}
                                  className="px-3 py-1 text-xs bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  ← Prev
                                </button>
                                <button
                                  onClick={() => setUserLinkPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={userLinkPage === totalPages}
                                  className="px-3 py-1 text-xs bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded hover:bg-[#3E4E5A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Next →
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setIsLinkingUser(false)
                            setLinkingPlayerIdForUser(null)
                            setLinkingUserIdForPlayer(null)
                            setUserSearchTerm('')
                            setUserLinkPage(1)
                          }}
                          className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => linkingUserIdForPlayer && linkUserToPlayer(linkingPlayerIdForUser, linkingUserIdForPlayer)}
                          disabled={!linkingUserIdForPlayer}
                          className="px-4 py-2 bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40 rounded-lg hover:bg-[#CEA17A]/35 disabled:opacity-50"
                        >
                          Link User
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}

          {/* Skills Tab Content */}
          {activeTab === 'skills' && (
            <>
              <div className="bg-[#09171F]/50 rounded-lg shadow-sm border border-[#CEA17A]/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#DBD0C0]">Player Skills Configuration</h2>
                  <button
                    onClick={() => setIsAddingSkill(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    Add New Skill
                  </button>
                </div>
                
                {/* Add New Skill Form */}
                {isAddingSkill && (
                  <div className="mb-6 p-4 bg-[#19171b] rounded-lg">
                    <h3 className="text-base sm:text-lg font-medium text-[#DBD0C0] mb-4">Add New Player Skill</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Skill Name</label>
                        <input
                          type="text"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                          placeholder="e.g., Batting Style"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Skill Type</label>
                        <select
                          value={newSkill.type}
                          onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                        >
                          <option value="select">Select</option>
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="multiselect">Multi-Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#DBD0C0] mb-1">Display Order</label>
                        <input
                          type="number"
                          value={newSkill.displayOrder}
                          onChange={(e) => setNewSkill({ ...newSkill, displayOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newSkill.required}
                            onChange={(e) => setNewSkill({ ...newSkill, required: e.target.checked })}
                            className="rounded border-[#CEA17A]/25 text-[#CEA17A] focus:ring-[#CEA17A]/50"
                          />
                          <span className="ml-2 text-sm text-[#DBD0C0]">Required</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newSkill.isAdminManaged}
                            onChange={(e) => setNewSkill({ ...newSkill, isAdminManaged: e.target.checked })}
                            className="rounded border-[#CEA17A]/25 text-[#CEA17A] focus:ring-[#CEA17A]/50"
                          />
                          <span className="ml-2 text-sm text-[#DBD0C0]">Admin Managed</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newSkill.viewerCanSee}
                            onChange={(e) => setNewSkill({ ...newSkill, viewerCanSee: e.target.checked })}
                            className="rounded border-[#CEA17A]/25 text-[#CEA17A] focus:ring-[#CEA17A]/50"
                          />
                          <span className="ml-2 text-sm text-[#DBD0C0]">Viewer Can See</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
                      <button
                        onClick={() => {
                          setIsAddingSkill(false)
                          setNewSkill({ name: '', type: 'select', required: false, displayOrder: 0, isAdminManaged: false, viewerCanSee: true })
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addPlayerSkill}
                        disabled={!newSkill.name}
                        className="w-full sm:w-auto px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Skill
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Skills List */}
                <div className="space-y-3">
                  {playerSkills.map((skill) => (
                    <div key={skill.id} className="border border-[#CEA17A]/20 rounded-lg">
                      {/* Skill Header - Always Visible */}
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                          <div className="flex items-center space-x-3 flex-1">
                            <button
                              onClick={() => toggleSkillExpansion(skill.id)}
                              className="flex items-center space-x-2 text-left hover:bg-[#19171b] p-2 rounded transition-colors flex-1"
                            >
                              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {expandedSkills.has(skill.id) ? (
                                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-medium text-[#DBD0C0]">{skill.skill_name}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-xs sm:text-sm text-gray-500">Type: {skill.skill_type}</span>
                                  <span className="text-xs sm:text-sm text-gray-500">Order: {skill.display_order}</span>
                                  {skill.is_required && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                      Required
                                    </span>
                                  )}
                                  {skill.is_admin_managed && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                      Admin Managed
                                    </span>
                                  )}
                                  {!skill.viewer_can_see && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                      Hidden from Viewers
                                    </span>
                                  )}
                                  {skill.values && skill.values.length > 0 && (
                                    <span className="text-xs sm:text-sm text-gray-500">
                                      {skill.values.length} value{skill.values.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                              onClick={() => {
                                setIsEditingSkill(skill.id)
                                setEditingSkill({
                                  name: skill.skill_name,
                                  type: skill.skill_type,
                                  required: skill.is_required,
                                  displayOrder: skill.display_order,
                                  isAdminManaged: skill.is_admin_managed,
                                  viewerCanSee: skill.viewer_can_see
                                })
                              }}
                              className="w-full sm:w-auto px-3 py-1 text-blue-600 hover:text-blue-800 text-sm border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deletePlayerSkill(skill.id)}
                              className="w-full sm:w-auto px-3 py-1 text-red-600 hover:text-red-800 text-sm border border-red-200 rounded hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Edit Form */}
                      {isEditingSkill === skill.id && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-[#DBD0C0] mb-3">Edit Skill</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Skill Name *
                              </label>
                              <input
                                type="text"
                                value={editingSkill.name}
                                onChange={(e) => setEditingSkill(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Experience Level"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Skill Type *
                              </label>
                              <select
                                value={editingSkill.type}
                                onChange={(e) => setEditingSkill(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="select">Select (Dropdown)</option>
                                <option value="multiselect">Multi-Select (Checkboxes)</option>
                                <option value="number">Number</option>
                                <option value="text">Text</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Display Order
                              </label>
                              <input
                                type="number"
                                value={editingSkill.displayOrder}
                                onChange={(e) => setEditingSkill(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`required-${skill.id}`}
                                checked={editingSkill.required}
                                onChange={(e) => setEditingSkill(prev => ({ ...prev, required: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`required-${skill.id}`} className="ml-2 text-sm text-gray-700">
                                Required field
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`admin-managed-${skill.id}`}
                                checked={editingSkill.isAdminManaged}
                                onChange={(e) => setEditingSkill(prev => ({ ...prev, isAdminManaged: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`admin-managed-${skill.id}`} className="ml-2 text-sm text-gray-700">
                                Admin managed (only admins/hosts can edit)
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`viewer-can-see-${skill.id}`}
                                checked={editingSkill.viewerCanSee}
                                onChange={(e) => setEditingSkill(prev => ({ ...prev, viewerCanSee: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`viewer-can-see-${skill.id}`} className="ml-2 text-sm text-gray-700">
                                Viewer can see this skill
                              </label>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
                            <button
                              onClick={() => {
                                setIsEditingSkill(null)
                                setEditingSkill({ name: '', type: 'select', required: false, displayOrder: 0, isAdminManaged: false, viewerCanSee: true })
                              }}
                              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-[#19171b] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={editPlayerSkill}
                              disabled={!editingSkill.name}
                              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Update Skill
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Collapsible Content */}
                      {expandedSkills.has(skill.id) && (
                        <div className="border-t border-[#CEA17A]/20 p-4 bg-[#19171b]">
                          {/* Skill Values */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium text-[#DBD0C0]">Skill Values</h4>
                              <button
                                onClick={() => {
                                  setIsAddingValue(true)
                                  setNewValue({ skillId: skill.id, valueName: '', displayOrder: 0 })
                                }}
                                className="text-xs px-2 py-1 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-150"
                              >
                                Add Value
                              </button>
                            </div>
                            
                            {/* Add Value Form */}
                            {isAddingValue && newValue.skillId === skill.id && (
                              <div className="mb-4 p-3 bg-[#09171F]/50 rounded border">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <input
                                    type="text"
                                    value={newValue.valueName}
                                    onChange={(e) => setNewValue({ ...newValue, valueName: e.target.value })}
                                    placeholder="Value name"
                                    className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                  />
                                  <input
                                    type="number"
                                    value={newValue.displayOrder}
                                    onChange={(e) => setNewValue({ ...newValue, displayOrder: parseInt(e.target.value) || 0 })}
                                    placeholder="Display order"
                                    className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={addSkillValue}
                                      disabled={!newValue.valueName}
                                      className="px-3 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded text-sm hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Add
                                    </button>
                                    <button
                                      onClick={() => {
                                        setIsAddingValue(false)
                                        setNewValue({ skillId: '', valueName: '', displayOrder: 0 })
                                      }}
                                      className="px-3 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded text-sm hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-150"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Values List */}
                            <div className="space-y-2">
                              {skill.values && skill.values.length > 0 ? (
                                skill.values.map((value) => (
                                  <div key={value.id} className="flex items-center justify-between p-2 bg-[#09171F]/50 rounded border">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm text-[#DBD0C0]">{value.value_name}</span>
                                      <span className="text-xs text-gray-500">Order: {value.display_order}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => {
                                          setIsEditingValue(value.id)
                                          setEditingValue({
                                            skillId: skill.id,
                                            valueId: value.id,
                                            valueName: value.value_name,
                                            displayOrder: value.display_order
                                          })
                                        }}
                                        className="text-xs px-2 py-1 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-150"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => deleteSkillValue(value.id)}
                                        className="text-xs px-2 py-1 bg-red-500/15 text-red-300 border border-red-500/25 shadow-lg shadow-red-500/10 backdrop-blur-sm rounded hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-150"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 italic">No values defined for this skill</p>
                              )}
                            </div>
                            
                            {/* Edit Value Form */}
                            {isEditingValue && editingValue.skillId === skill.id && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="text-sm font-medium text-[#DBD0C0] mb-2">Edit Value</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Value Name *
                                    </label>
                                    <input
                                      type="text"
                                      value={editingValue.valueName}
                                      onChange={(e) => setEditingValue(prev => ({ ...prev, valueName: e.target.value }))}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="e.g., Right Hand"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Display Order
                                    </label>
                                    <input
                                      type="number"
                                      value={editingValue.displayOrder}
                                      onChange={(e) => setEditingValue(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      min="0"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                                  <button
                                    onClick={() => {
                                      setIsEditingValue(null)
                                      setEditingValue({ skillId: '', valueId: '', valueName: '', displayOrder: 0 })
                                    }}
                                    className="w-full sm:w-auto px-3 py-1 text-xs bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-150"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={editSkillValue}
                                    disabled={!editingValue.valueName}
                                    className="w-full sm:w-auto px-3 py-1 text-xs bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Update Value
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* API Access Control Tab Content */}
          {activeTab === 'api-access' && (
            <>
              <div className="bg-[#09171F]/50 rounded-lg shadow-sm border border-[#CEA17A]/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#DBD0C0]">API Access Control</h2>
                  <div className="text-sm text-[#CEA17A]">
                    Total APIs: {API_ACCESS_CONFIG.length} | 
                    Active: {getAPIsByStatus('active').length} | 
                    Deprecated: {getAPIsByStatus('deprecated').length}
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#DBD0C0] mb-2">Access Type</label>
                      <select
                        value={apiAccessFilter}
                        onChange={(e) => setApiAccessFilter(e.target.value as any)}
                        className="px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                      >
                        <option value="all">All Access Types</option>
                        <option value="public">Public</option>
                        <option value="authenticated">Authenticated</option>
                        <option value="role-based">Role-Based</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#DBD0C0] mb-2">Status</label>
                      <select
                        value={apiStatusFilter}
                        onChange={(e) => setApiStatusFilter(e.target.value as any)}
                        className="px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="deprecated">Deprecated</option>
                        <option value="planned">Planned</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#DBD0C0] mb-2">Role</label>
                      <select
                        value={apiRoleFilter}
                        onChange={(e) => setApiRoleFilter(e.target.value as any)}
                        className="px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="host">Host</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* API List */}
                <div className="space-y-4">
                  {API_ACCESS_CONFIG
                    .filter(api => {
                      if (apiAccessFilter !== 'all' && api.accessType !== apiAccessFilter) return false
                      if (apiStatusFilter !== 'all' && api.status !== apiStatusFilter) return false
                      if (apiRoleFilter !== 'all' && apiRoleFilter !== 'viewer') {
                        if (api.accessType !== 'role-based' || !api.requiredRoles?.includes(apiRoleFilter)) return false
                      }
                      return true
                    })
                    .map((api, index) => (
                      <div key={index} className="border border-[#CEA17A]/20 rounded-lg p-4 bg-[#19171b]">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                api.method === 'GET' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                api.method === 'POST' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                api.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {api.method}
                              </span>
                              <span className="text-sm font-medium text-[#DBD0C0]">{api.route}</span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                api.status === 'active' ? 'bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/40' :
                                api.status === 'deprecated' ? 'bg-[#75020f]/25 text-[#75020f] border border-[#75020f]/40' :
                                'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
                              }`}>
                                {api.status}
                              </span>
                            </div>
                            <p className="text-sm text-[#DBD0C0] mb-2">{api.description}</p>
                            {api.notes && (
                              <p className="text-xs text-[#CEA17A] mb-2">{api.notes}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              api.accessType === 'public' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                              api.accessType === 'authenticated' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {api.accessType}
                            </span>
                            {api.requiredRoles && (
                              <div className="flex flex-wrap gap-1">
                                {api.requiredRoles.map(role => (
                                  <span key={role} className="px-2 py-1 text-xs bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/40 rounded">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Summary Statistics */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#19171b] rounded-lg p-4 border border-[#CEA17A]/20">
                    <h3 className="text-sm font-medium text-[#DBD0C0] mb-2">Public APIs</h3>
                    <p className="text-2xl font-bold text-green-300">{getAPIsByAccessType('public').length}</p>
                    <p className="text-xs text-[#CEA17A]">No authentication required</p>
                  </div>
                  <div className="bg-[#19171b] rounded-lg p-4 border border-[#CEA17A]/20">
                    <h3 className="text-sm font-medium text-[#DBD0C0] mb-2">Authenticated APIs</h3>
                    <p className="text-2xl font-bold text-blue-300">{getAPIsByAccessType('authenticated').length}</p>
                    <p className="text-xs text-[#CEA17A]">Login required</p>
                  </div>
                  <div className="bg-[#19171b] rounded-lg p-4 border border-[#CEA17A]/20">
                    <h3 className="text-sm font-medium text-[#DBD0C0] mb-2">Role-Based APIs</h3>
                    <p className="text-2xl font-bold text-purple-300">{getAPIsByAccessType('role-based').length}</p>
                    <p className="text-xs text-[#CEA17A]">Specific roles required</p>
                  </div>
                  <div className="bg-[#19171b] rounded-lg p-4 border border-[#CEA17A]/20">
                    <h3 className="text-sm font-medium text-[#DBD0C0] mb-2">Admin APIs</h3>
                    <p className="text-2xl font-bold text-red-300">{getAPIsByRole('admin').length}</p>
                    <p className="text-xs text-[#CEA17A]">Admin only</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <>
              <div className="bg-[#09171F]/50 rounded-lg shadow-sm border border-[#CEA17A]/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-[#DBD0C0]">API Usage Analytics</h2>
                    {isConnected && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">Live</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={analyticsPeriod}
                      onChange={(e) => setAnalyticsPeriod(e.target.value as any)}
                      className="px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                    <button
                      onClick={fetchAnalyticsData}
                      disabled={analyticsLoading}
                      className="px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium disabled:opacity-50"
                    >
                      {analyticsLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
                    <p className="text-[#CEA17A]">Loading analytics data...</p>
                  </div>
                ) : (
                  <>
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="bg-[#19171b] rounded-lg p-4 border border-[#CEA17A]/20">
                        <h3 className="text-sm font-medium text-[#DBD0C0] mb-2">Total API Calls</h3>
                        <p className="text-2xl font-bold text-blue-300">
                          {analyticsData ? analyticsData.reduce((sum: number, item: any) => sum + parseInt(item.total_requests), 0) : 0}
                        </p>
                        <p className="text-xs text-[#CEA17A]">All endpoints</p>
                      </div>
                      <div className="bg-[#19171b] rounded-lg p-4 border border-[#CEA17A]/20">
                        <h3 className="text-sm font-medium text-[#DBD0C0] mb-2">Unique Users</h3>
                        <p className="text-2xl font-bold text-green-300">
                          {userActivityData ? userActivityData.length : 0}
                        </p>
                        <p className="text-xs text-[#CEA17A]">Active users</p>
                      </div>
                      <div className="bg-[#19171b] rounded-lg p-4 border border-[#CEA17A]/20">
                        <h3 className="text-sm font-medium text-[#DBD0C0] mb-2">Avg Response Time</h3>
                        <p className="text-2xl font-bold text-yellow-300">
                          {analyticsData && analyticsData.length > 0 
                            ? Math.round(analyticsData.reduce((sum: number, item: any) => sum + parseFloat(item.avg_response_time_ms || 0), 0) / analyticsData.length)
                            : 0}ms
                        </p>
                        <p className="text-xs text-[#CEA17A]">Across all APIs</p>
                      </div>
                      <div className="bg-[#19171b] rounded-lg p-4 border border-[#CEA17A]/20">
                        <h3 className="text-sm font-medium text-[#DBD0C0] mb-2">Success Rate</h3>
                        <p className="text-2xl font-bold text-green-300">
                          {analyticsData && analyticsData.length > 0 
                            ? Math.round(analyticsData.reduce((sum: number, item: any) => sum + parseFloat(item.success_rate || 0), 0) / analyticsData.length)
                            : 0}%
                        </p>
                        <p className="text-xs text-[#CEA17A]">Overall success</p>
                      </div>
                    </div>

                    {/* Top API Endpoints */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-[#DBD0C0] mb-4">Most Used API Endpoints</h3>
                      <div className="bg-[#19171b] rounded-lg border border-[#CEA17A]/20 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-[#CEA17A]/20">
                            <thead className="bg-[#3E4E5A]/15">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">API Endpoint</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Total Requests</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Unique Users</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Avg Response Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Success Rate</th>
                              </tr>
                            </thead>
                            <tbody className="bg-[#09171F]/50 divide-y divide-[#CEA17A]/20">
                              {analyticsData && analyticsData.slice(0, 10).map((api: any, index: number) => (
                                <tr key={index} className="hover:bg-[#3E4E5A]/10 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {api.route}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      api.method === 'GET' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                      api.method === 'POST' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                      api.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                      'bg-red-500/20 text-red-300 border border-red-500/30'
                                    }`}>
                                      {api.method}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {api.total_requests}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {api.unique_users}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {Math.round(api.avg_response_time_ms || 0)}ms
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      parseFloat(api.success_rate || 0) >= 95 ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                      parseFloat(api.success_rate || 0) >= 90 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                      'bg-red-500/20 text-red-300 border border-red-500/30'
                                    }`}>
                                      {Math.round(api.success_rate || 0)}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* User Activity */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-[#DBD0C0] mb-4">Most Active Users</h3>
                      <div className="bg-[#19171b] rounded-lg border border-[#CEA17A]/20 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-[#CEA17A]/20">
                            <thead className="bg-[#3E4E5A]/15">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Total Requests</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Unique Routes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Last Activity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Avg Response Time</th>
                              </tr>
                            </thead>
                            <tbody className="bg-[#09171F]/50 divide-y divide-[#CEA17A]/20">
                              {userActivityData && userActivityData.slice(0, 10).map((user: any, index: number) => (
                                <tr key={index} className="hover:bg-[#3E4E5A]/10 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {user.user_email}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      user.user_role === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                      user.user_role === 'host' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                      'bg-green-500/20 text-green-300 border border-green-500/30'
                                    }`}>
                                      {user.user_role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {user.total_requests}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {user.unique_routes}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {new Date(user.last_activity).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {Math.round(user.avg_response_time_ms || 0)}ms
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Hourly Usage Patterns */}
                    <div>
                      <h3 className="text-lg font-semibold text-[#DBD0C0] mb-4">Hourly Usage Patterns</h3>
                      <div className="bg-[#19171b] rounded-lg border border-[#CEA17A]/20 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-[#CEA17A]/20">
                            <thead className="bg-[#3E4E5A]/15">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Hour</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Total Requests</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Unique Users</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Avg Response Time</th>
                              </tr>
                            </thead>
                            <tbody className="bg-[#09171F]/50 divide-y divide-[#CEA17A]/20">
                              {usagePatternsData && usagePatternsData.map((pattern: any, index: number) => (
                                <tr key={index} className="hover:bg-[#3E4E5A]/10 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {pattern.hour_of_day}:00
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {pattern.total_requests}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {pattern.unique_users}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                    {Math.round(pattern.avg_response_time_ms || 0)}ms
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Real-time Recent Activity */}
                    {realtimeData && realtimeData.recentActivity.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-[#DBD0C0] mb-4">Recent Activity (Live)</h3>
                        <div className="bg-[#19171b] rounded-lg border border-[#CEA17A]/20 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#CEA17A]/20">
                              <thead className="bg-[#3E4E5A]/15">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Time</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">API Endpoint</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Method</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">User</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Response Time</th>
                                </tr>
                              </thead>
                              <tbody className="bg-[#09171F]/50 divide-y divide-[#CEA17A]/20">
                                {realtimeData.recentActivity.slice(0, 10).map((activity: any, index: number) => (
                                  <tr key={index} className="hover:bg-[#3E4E5A]/10 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                      {new Date(activity.created_at).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                      {activity.route}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        activity.method === 'GET' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                        activity.method === 'POST' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                        activity.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                        'bg-red-500/20 text-red-300 border border-red-500/30'
                                      }`}>
                                        {activity.method}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                      <div>
                                        <div className="font-medium">{activity.user_email || 'Anonymous'}</div>
                                        {activity.user_role && (
                                          <span className={`px-1 py-0.5 text-xs rounded ${
                                            activity.user_role === 'admin' ? 'bg-red-500/20 text-red-300' :
                                            activity.user_role === 'host' ? 'bg-blue-500/20 text-blue-300' :
                                            'bg-green-500/20 text-green-300'
                                          }`}>
                                            {activity.user_role}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        activity.response_status >= 200 && activity.response_status < 300 
                                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                        activity.response_status >= 400 
                                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                        'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                      }`}>
                                        {activity.response_status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DBD0C0]">
                                      {activity.response_time_ms}ms
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
          </div>

          {/* Base Price Modal - Moved outside tab conditionals */}
          {showBasePriceModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-[#09171F] to-[#1a2332] border border-[#CEA17A]/30 rounded-xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold text-[#CEA17A] mb-4">💰 Set Base Price</h3>
                <p className="text-[#DBD0C0] mb-4">
                  Please select a base price for this player before approving their profile.
                </p>
                
                {isLoadingBasePrices ? (
                  <div className="text-center py-4">
                    <div className="text-[#CEA17A]">Loading base price options...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#CEA17A] mb-2">
                        Base Price *
                      </label>
                      <select
                        value={selectedBasePrice}
                        onChange={(e) => setSelectedBasePrice(e.target.value)}
                        className="w-full px-3 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]"
                        required
                      >
                        <option value="">Select Base Price</option>
                        {availableBasePrices.map((price) => (
                          <option key={price} value={price}>
                            ₹{price}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowBasePriceModal(false)
                          setPlayerToApprove(null)
                          setSelectedBasePrice('')
                        }}
                        className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApproveWithBasePrice}
                        disabled={!selectedBasePrice}
                        className="px-4 py-2 bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40 rounded-lg hover:bg-[#CEA17A]/35 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve Player
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}