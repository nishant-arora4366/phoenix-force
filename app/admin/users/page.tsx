'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/lib/session'

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

export default function UserManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [playerProfiles, setPlayerProfiles] = useState<PlayerProfile[]>([])
  const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [activeTab, setActiveTab] = useState<'users' | 'players' | 'skills'>('users')
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
  const [isEditingValue, setIsEditingValue] = useState(false)
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

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get user from session manager
        const sessionUser = sessionManager.getUser()
        if (sessionUser) {
          setCurrentUser(sessionUser)
          
          // Check user role and status using API endpoint
          const response = await fetch(`/api/admin/check-user?userId=${sessionUser.id}`)
          
          if (!response.ok) {
            console.log('Failed to check user role, redirecting to home')
            router.push('/')
            return
          }
          
          const { success, user: userData } = await response.json()
          
          if (!success || !userData) {
            console.log('Failed to get user data, redirecting to home')
            router.push('/')
            return
          }
          
          setUserRole(userData.role)
          
          console.log('User role:', userData.role)
          console.log('User status:', userData.status)
          console.log('User data:', userData)
          
          if (userData.role !== 'admin') {
            console.log('User is not admin, redirecting to home')
            router.push('/')
            return
          }
          
          if (userData.status !== 'approved') {
            console.log('User is not approved, redirecting to home')
            router.push('/')
            return
          }
          
          // Fetch users if admin
          fetchUsers()
        } else {
          router.push('/signin')
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/signin')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    // Subscribe to session changes
    const unsubscribe = sessionManager.subscribe((sessionUser) => {
      if (sessionUser) {
        // Re-check permissions when user changes
        checkUser()
      } else {
        setCurrentUser(null)
        setUserRole(null)
        router.push('/signin')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  // Fetch player profiles when tab changes to players
  useEffect(() => {
    if (activeTab === 'players' && currentUser) {
      fetchPlayerProfiles()
    }
  }, [activeTab, currentUser])

  // Fetch player skills when tab changes to skills
  useEffect(() => {
    if (activeTab === 'skills' && currentUser) {
      fetchPlayerSkills()
    }
  }, [activeTab, currentUser])

  const fetchUsers = async () => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/admin/users?userId=${sessionUser.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const { success, users } = await response.json()
      
      if (success) {
        setUsers(users || [])
      } else {
        throw new Error('Failed to fetch users')
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setMessage('Error loading users')
    }
  }

  const fetchPlayerProfiles = async () => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/admin/player-profiles?userId=${sessionUser.id}`)
      
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

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/admin/users?userId=${sessionUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
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

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/admin/users?userId=${sessionUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
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
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/admin/reset-password?userId=${sessionUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

  const updatePlayerProfileStatus = async (playerId: string, status: string) => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/admin/player-profiles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          playerId,
          status
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update player profile status')
      }

      const { success } = await response.json()

      if (success) {
        setMessage(`Player profile ${status} successfully!`)
        fetchPlayerProfiles() // Refresh the list
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error('Failed to update player profile status')
      }
    } catch (error: any) {
      console.error('Error updating player profile status:', error)
      setMessage(`Error: ${error.message}`)
    }
  }

  const fetchPlayerSkills = async () => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/admin/player-skills?userId=${sessionUser.id}`)
      
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

  const addPlayerSkill = async () => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/player-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/player-skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
    if (!confirm('Are you sure you want to delete this skill? This will also delete all its values.')) {
      return
    }

    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/player-skills', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
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
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/player-skill-values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          skillId: newValue.skillId,
          value: newValue
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add skill value')
      }

      const result = await response.json()
      if (result.success) {
        setMessage('Skill value added successfully')
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
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/player-skill-values', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionUser.id,
          valueId: editingValue.valueId,
          value: editingValue
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update skill value')
      }

      const result = await response.json()
      if (result.success) {
        setMessage('Skill value updated successfully')
        setIsEditingValue(false)
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
    if (!confirm('Are you sure you want to delete this skill value?')) {
      return
    }

    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/player-skill-values', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-700'
      case 'approved':
        return 'bg-gray-100 text-gray-700'
      case 'rejected':
        return 'bg-gray-300 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gray-200 text-gray-800'
      case 'host':
        return 'bg-gray-100 text-gray-700'
      case 'viewer':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlayerProfileStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    return user.status === filter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
                <p className="text-gray-200 mt-1">Manage users and player profiles</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="mt-4 sm:mt-0 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('players')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'players'
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Player Profiles
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'skills'
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Player Skills
              </button>
            </nav>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-gray-200 text-gray-800 border border-gray-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            {message}
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* Filters */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Users' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ].map((filterOption) => (
                  <button
                    key={filterOption.value}
                    onClick={() => setFilter(filterOption.value as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption.value
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

        {/* Users Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Player Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstname?.[0] || user.username?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstname && user.lastname 
                              ? `${user.firstname} ${user.lastname}`
                              : user.username || user.email
                            }
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.player_profile ? (
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-gray-900">
                            {user.player_profile.display_name}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlayerProfileStatusColor(user.player_profile.status)}`}>
                            {user.player_profile.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No profile</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateUserStatus(user.id, 'approved')}
                            className="text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateUserStatus(user.id, 'rejected')}
                            className="text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user.status === 'approved' && (
                        <div className="flex flex-col space-y-2">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="host">Host</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => resetUserPassword(user.id, user.email)}
                            className="text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                          >
                            Reset Password
                          </button>
                          {user.player_profile && user.player_profile.status === 'pending' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => updatePlayerProfileStatus(user.player_profile!.id, 'approved')}
                                className="text-xs text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200 px-2 py-1 rounded"
                              >
                                Approve Profile
                              </button>
                              <button
                                onClick={() => updatePlayerProfileStatus(user.player_profile!.id, 'rejected')}
                                className="text-xs text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                              >
                                Reject Profile
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.firstname?.[0] || user.username?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstname && user.lastname 
                        ? `${user.firstname} ${user.lastname}`
                        : user.username || user.email
                      }
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  {user.player_profile && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-600">
                        Player: {user.player_profile.display_name}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlayerProfileStatusColor(user.player_profile.status)}`}>
                        {user.player_profile.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-3">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </div>
              
              <div className="flex flex-col space-y-2">
                {user.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateUserStatus(user.id, 'approved')}
                      className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateUserStatus(user.id, 'rejected')}
                      className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {user.status === 'approved' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <button
                      onClick={() => resetUserPassword(user.id, user.email)}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Reset Password
                    </button>
                    {user.player_profile && user.player_profile.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updatePlayerProfileStatus(user.player_profile!.id, 'approved')}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Approve Profile
                        </button>
                        <button
                          onClick={() => updatePlayerProfileStatus(user.player_profile!.id, 'rejected')}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Reject Profile
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">No users found</div>
          </div>
        )}
          </>
        )}

        {/* Players Tab Content */}
        {activeTab === 'players' && (
          <>
            {/* Player Profiles Table - Desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {playerProfiles.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {player.profile_pic_url ? (
                                <img className="h-10 w-10 rounded-full object-cover" src={player.profile_pic_url} alt={player.display_name} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {player.display_name ? player.display_name.charAt(0).toUpperCase() : '?'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{player.display_name}</div>
                              <div className="text-sm text-gray-500">{player.bio}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {player.users?.firstname && player.users?.lastname 
                              ? `${player.users.firstname} ${player.users.lastname}`
                              : player.users?.email
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Player</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">-</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}>
                            {player.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(player.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {player.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updatePlayerProfileStatus(player.id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updatePlayerProfileStatus(player.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Player Profiles Cards - Mobile */}
            <div className="md:hidden space-y-4">
              {playerProfiles.map((player) => (
                <div key={player.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    {player.profile_pic_url ? (
                      <img className="h-12 w-12 rounded-full object-cover" src={player.profile_pic_url} alt={player.display_name} />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {player.display_name ? player.display_name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{player.display_name}</div>
                      <div className="text-sm text-gray-500">
                        {player.users?.firstname && player.users?.lastname 
                          ? `${player.users.firstname} ${player.users.lastname}`
                          : player.users?.email
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Role:</span>
                      <span className="text-sm text-gray-900">Player</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="text-sm text-gray-900">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}>
                        {player.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Created:</span>
                      <span className="text-sm text-gray-900">{new Date(player.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {player.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updatePlayerProfileStatus(player.id, 'approved')}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updatePlayerProfileStatus(player.id, 'rejected')}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {playerProfiles.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500">No player profiles found</div>
                <div className="text-sm text-gray-400 mt-2">
                  Player profiles will appear here when users create them
                </div>
              </div>
            )}
          </>
        )}

        {/* Skills Tab Content */}
        {activeTab === 'skills' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Player Skills Configuration</h2>
                <button 
                  onClick={() => setIsAddingSkill(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Add New Skill
                </button>
              </div>

              {/* Add New Skill Form */}
              {isAddingSkill && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Player Skill</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skill Name *
                      </label>
                      <input
                        type="text"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g., Experience Level"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skill Type *
                      </label>
                            <select
                              value={newSkill.type}
                              onChange={(e) => setNewSkill(prev => ({ ...prev, type: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                        value={newSkill.displayOrder}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        min="0"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="required"
                        checked={newSkill.required}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, required: e.target.checked }))}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                        Required field
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isAdminManaged"
                        checked={newSkill.isAdminManaged}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, isAdminManaged: e.target.checked }))}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isAdminManaged" className="ml-2 text-sm text-gray-700">
                        Admin managed (only admins/hosts can edit)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="viewerCanSee"
                        checked={newSkill.viewerCanSee}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, viewerCanSee: e.target.checked }))}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        disabled={newSkill.isAdminManaged}
                      />
                      <label htmlFor="viewerCanSee" className="ml-2 text-sm text-gray-700">
                        Viewer can see this skill
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => {
                        setIsAddingSkill(false)
                        setNewSkill({ name: '', type: 'select', required: false, displayOrder: 0, isAdminManaged: false, viewerCanSee: true })
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addPlayerSkill}
                      disabled={!newSkill.name}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Skill
                    </button>
                  </div>
                </div>
              )}

              {/* Skills List */}
              <div className="space-y-3">
                {playerSkills.map((skill) => (
                  <div key={skill.id} className="border border-gray-200 rounded-lg">
                    {/* Skill Header - Always Visible */}
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleSkillExpansion(skill.id)}
                            className="flex items-center space-x-2 text-left hover:bg-gray-50 p-2 rounded transition-colors"
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
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
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{skill.skill_name}</h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-gray-500">Type: {skill.skill_type}</span>
                                <span className="text-sm text-gray-500">Order: {skill.display_order}</span>
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
                                  <span className="text-sm text-gray-500">
                                    {skill.values.length} value{skill.values.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                        <div className="flex space-x-2">
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
                            className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deletePlayerSkill(skill.id)}
                            className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {expandedSkills.has(skill.id) && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        {/* Skill Values */}
                        <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Values:</h4>
                        <button
                          onClick={() => {
                            setIsAddingValue(true)
                            setNewValue({ skillId: skill.id, valueName: '', displayOrder: (skill.values?.length || 0) + 1 })
                          }}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          + Add Value
                        </button>
                      </div>
                      
                      {skill.values && skill.values.length > 0 && (
                        <div className="space-y-2">
                          {skill.values.map((value) => (
                            <div key={value.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                value.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {value.value_name}
                              </span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    setIsEditingValue(true)
                                    setEditingValue({
                                      skillId: skill.id,
                                      valueId: value.id,
                                      valueName: value.value_name,
                                      displayOrder: value.display_order
                                    })
                                  }}
                                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteSkillValue(value.id)}
                                  className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Value Form */}
                      {isAddingValue && newValue.skillId === skill.id && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Add New Value</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Value Name *
                              </label>
                              <input
                                type="text"
                                value={newValue.valueName}
                                onChange={(e) => setNewValue(prev => ({ ...prev, valueName: e.target.value }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g., Right Hand"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Display Order
                              </label>
                              <input
                                type="number"
                                value={newValue.displayOrder}
                                onChange={(e) => setNewValue(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                min="0"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-3">
                            <button
                              onClick={() => {
                                setIsAddingValue(false)
                                setNewValue({ skillId: '', valueName: '', displayOrder: 0 })
                              }}
                              className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={addSkillValue}
                              disabled={!newValue.valueName}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Add Value
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Edit Value Form */}
                      {isEditingValue && editingValue.skillId === skill.id && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Edit Value</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <div className="flex justify-end space-x-2 mt-3">
                            <button
                              onClick={() => {
                                setIsEditingValue(false)
                                setEditingValue({ skillId: '', valueId: '', valueName: '', displayOrder: 0 })
                              }}
                              className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={editSkillValue}
                              disabled={!editingValue.valueName}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Update Value
                            </button>
                          </div>
                        </div>
                        )}
                        </div>
                      </div>
                    )}

                    {/* Edit Form */}
                    {isEditingSkill === skill.id && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Edit Skill</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              disabled={editingSkill.isAdminManaged}
                            />
                            <label htmlFor={`viewer-can-see-${skill.id}`} className="ml-2 text-sm text-gray-700">
                              Viewer can see this skill
                            </label>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                          <button
                            onClick={() => {
                              setIsEditingSkill(null)
                              setEditingSkill({ name: '', type: 'select', required: false, displayOrder: 0, isAdminManaged: false, viewerCanSee: true })
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={editPlayerSkill}
                            disabled={!editingSkill.name}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Update Skill
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {playerSkills.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">No player skills configured</div>
                  <p className="text-sm text-gray-400 mt-2">Add skills to configure what players can select</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
