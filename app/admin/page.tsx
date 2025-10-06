'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { sessionManager } from '@/lib/session'

interface User {
  id: string
  email: string
  username?: string
  firstname: string
  lastname: string
  role: string
  created_at: string
  updated_at: string
}

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')

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

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
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
        <nav className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900">
                  Phoenix Force Cricket
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/signin"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </nav>

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
        <nav className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900">
                  Phoenix Force Cricket
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Phoenix Force Cricket
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/players"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Players
              </Link>
              <Link
                href="/tournaments"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Tournaments
              </Link>
              <span className="text-sm text-gray-600">
                Welcome, {user.email} (Admin)
              </span>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {message}
            </div>
          )}

          {/* Search User Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Update User Role</h2>
            <div className="flex space-x-4">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Enter user email"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <button
                onClick={searchUser}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
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
                
                <div className="mt-4 flex space-x-4">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="host">Host</option>
                    <option value="captain">Captain</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={updateUserRole}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Update Role
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* All Users List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.firstname} {user.lastname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'host' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'captain' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
