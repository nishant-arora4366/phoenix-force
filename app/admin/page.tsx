'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { sessionManager } from '@/src/lib/session'

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
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [playerProfiles, setPlayerProfiles] = useState<PlayerProfile[]>([])
  const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'players' | 'skills'>('users')
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
    const getUser = async () => {
      const currentUser = sessionManager.getUser()
      setUser(currentUser)
      
      if (currentUser) {
        // Check if user is admin
        if (currentUser.role === 'admin') {
          // Load all users for admin panel
          await loadUsers()
        } else {
          setMessage('Access denied. Admin role required.')
        }
      }
      
      setLoading(false)
    }
    getUser()

    const unsubscribe = sessionManager.subscribe((userData) => {
      setUser(userData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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

  const loadUsers = async () => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/admin/users?userId=${sessionUser.id}`)
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

  const updateUserRoleFromTable = async (userId: string, role: string) => {
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

      const response = await fetch(`/api/admin/player-profiles?userId=${sessionUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          status
        })
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
    if (!confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
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
    if (!confirm('Are you sure you want to delete this skill value? This action cannot be undone.')) {
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

  const handleSignOut = async () => {
    sessionManager.clearUser()
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Please Sign In
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              You need to be signed in to access the admin panel.
            </p>
            <Link
              href="/signin"
              className="inline-block px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (message === 'Access denied. Admin role required.') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Access Denied
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              You need admin privileges to access this page.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Admin Panel</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {message}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
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
                Player Management
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'skills'
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Skill Management
              </button>
            </nav>
          </div>

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <>
              {/* Search User Section */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Update User Role</h2>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter user email"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                  <button
                    onClick={searchUser}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Search
                  </button>
                </div>

                {selectedUser && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">User Found:</h3>
                    <p><strong>Name:</strong> {selectedUser.firstname} {selectedUser.lastname}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Current Role:</strong> {selectedUser.role}</p>
                    
                    <div className="mt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="host">Host</option>
                        <option value="captain">Captain</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={updateUserRole}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
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
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === 'all'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All Users
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('approved')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === 'approved'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-200 text-green-700 hover:bg-green-300'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setFilter('rejected')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-200 text-red-700 hover:bg-red-300'
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>

              {/* All Users List */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">All Users</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users
                        .filter(user => filter === 'all' || user.status === filter)
                        .map((user) => (
                        <tr key={user.id}>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.firstname} {user.lastname}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRoleFromTable(user.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="host">Host</option>
                              <option value="captain">Captain</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'approved' ? 'bg-green-100 text-green-800' :
                              user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {user.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateUserStatus(user.id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateUserStatus(user.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => resetUserPassword(user.id, user.email)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Reset Password
                            </button>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Players Tab Content */}
          {activeTab === 'players' && (
            <>
              {/* Player Profiles Table - Desktop */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Player Profiles</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Player Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {playerProfiles.map((profile) => (
                        <tr key={profile.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {profile.display_name}
                            </div>
                            {profile.bio && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {profile.bio}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {profile.users ? (
                              <div>
                                <div className="font-medium">
                                  {profile.users.firstname} {profile.users.lastname}
                                </div>
                                <div className="text-gray-500">{profile.users.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No user data</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              profile.status === 'approved' ? 'bg-green-100 text-green-800' :
                              profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              profile.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {profile.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {profile.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updatePlayerProfileStatus(profile.id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updatePlayerProfileStatus(profile.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Player Profiles - Mobile */}
              <div className="md:hidden space-y-4">
                {playerProfiles.map((profile) => (
                  <div key={profile.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {profile.display_name}
                        </h3>
                        {profile.users && (
                          <p className="text-sm text-gray-600">
                            {profile.users.firstname} {profile.users.lastname}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        profile.status === 'approved' ? 'bg-green-100 text-green-800' :
                        profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        profile.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.status}
                      </span>
                    </div>
                    
                    {profile.bio && (
                      <p className="text-sm text-gray-600 mb-3">{profile.bio}</p>
                    )}
                    
                    {profile.users && (
                      <p className="text-sm text-gray-500 mb-3">{profile.users.email}</p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Created: {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                      {profile.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => updatePlayerProfileStatus(profile.id, 'approved')}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updatePlayerProfileStatus(profile.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Skills Tab Content */}
          {activeTab === 'skills' && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Player Skills Configuration</h2>
                  <button
                    onClick={() => setIsAddingSkill(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Add New Skill
                  </button>
                </div>
                
                {/* Add New Skill Form */}
                {isAddingSkill && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Add New Player Skill</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
                        <input
                          type="text"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                          placeholder="e.g., Batting Style"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skill Type</label>
                        <select
                          value={newSkill.type}
                          onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="select">Select</option>
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="multiselect">Multi-Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          value={newSkill.displayOrder}
                          onChange={(e) => setNewSkill({ ...newSkill, displayOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newSkill.required}
                            onChange={(e) => setNewSkill({ ...newSkill, required: e.target.checked })}
                            className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Required</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newSkill.isAdminManaged}
                            onChange={(e) => setNewSkill({ ...newSkill, isAdminManaged: e.target.checked })}
                            className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Admin Managed</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newSkill.viewerCanSee}
                            onChange={(e) => setNewSkill({ ...newSkill, viewerCanSee: e.target.checked })}
                            className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Viewer Can See</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
                      <button
                        onClick={() => {
                          setIsAddingSkill(false)
                          setNewSkill({ name: '', type: 'select', required: false, displayOrder: 0, isAdminManaged: false, viewerCanSee: true })
                        }}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addPlayerSkill}
                        disabled={!newSkill.name}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                          <div className="flex items-center space-x-3 flex-1">
                            <button
                              onClick={() => toggleSkillExpansion(skill.id)}
                              className="flex items-center space-x-2 text-left hover:bg-gray-50 p-2 rounded transition-colors flex-1"
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
                                <h3 className="text-base sm:text-lg font-medium text-gray-900">{skill.skill_name}</h3>
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
                      
                      {/* Collapsible Content */}
                      {expandedSkills.has(skill.id) && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {/* Skill Values */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium text-gray-900">Skill Values</h4>
                              <button
                                onClick={() => {
                                  setIsAddingValue(true)
                                  setNewValue({ skillId: skill.id, valueName: '', displayOrder: 0 })
                                }}
                                className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                              >
                                Add Value
                              </button>
                            </div>
                            
                            {/* Add Value Form */}
                            {isAddingValue && newValue.skillId === skill.id && (
                              <div className="mb-4 p-3 bg-white rounded border">
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
                                      className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      Add
                                    </button>
                                    <button
                                      onClick={() => {
                                        setIsAddingValue(false)
                                        setNewValue({ skillId: '', valueName: '', displayOrder: 0 })
                                      }}
                                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
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
                                  <div key={value.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm text-gray-900">{value.value_name}</span>
                                      <span className="text-xs text-gray-500">Order: {value.display_order}</span>
                                    </div>
                                    <div className="flex space-x-2">
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
                                        className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => deleteSkillValue(value.id)}
                                        className="text-xs px-2 py-1 text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 transition-colors"
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
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}