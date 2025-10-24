'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { secureSessionManager } from '@/src/lib/secure-session'
import { API_ACCESS_GROUPS, APIGroup, APIAccessConfig } from '@/src/lib/api-access-config-grouped'
import { getStatusColor, getRoleColor } from '@/lib/utils'

export default function APIAccessControlPage() {
  const router = useRouter()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'deprecated' | 'planned'>('all')
  const [filterAccess, setFilterAccess] = useState<'all' | 'public' | 'authenticated' | 'role-based'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const sessionUser = secureSessionManager.getUser()
        if (!sessionUser) {
          router.push('/signin')
          return
        }
        
        setCurrentUser(sessionUser)
        
        if (sessionUser.role !== 'admin') {
          router.push('/')
          return
        }
        
        setIsLoading(false)
      } catch (error) {
        router.push('/signin')
      }
    }

    checkUser()
  }, [router])

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleAllGroups = (expand: boolean) => {
    if (expand) {
      setExpandedGroups(new Set(API_ACCESS_GROUPS.map(g => g.name)))
    } else {
      setExpandedGroups(new Set())
    }
  }

  const filterAPIs = (apis: APIAccessConfig[]): APIAccessConfig[] => {
    return apis.filter(api => {
      // Filter by search query
      if (searchQuery && !api.route.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !api.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Filter by status
      if (filterStatus !== 'all' && api.status !== filterStatus) {
        return false
      }
      
      // Filter by access type
      if (filterAccess !== 'all' && api.accessType !== filterAccess) {
        return false
      }
      
      return true
    })
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'POST': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'PUT': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'PATCH': return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
      case 'DELETE': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'public': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'authenticated': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'role-based': return 'text-purple-400 bg-purple-500/10 border-purple-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'deprecated': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'planned': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-[#DBD0C0]">Loading...</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
      <div className="absolute inset-0" 
           style={{
             background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
           }}></div>
      
      <div className="relative z-10 py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#DBD0C0]">API Access Control</h1>
                  <p className="text-[#CEA17A] mt-1">Manage API endpoints and access permissions</p>
                </div>
                <button
                  onClick={() => router.push('/admin')}
                  className="mt-4 sm:mt-0 px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                >
                  Back to Admin Panel
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:outline-none focus:border-[#CEA17A]/50 placeholder-[#DBD0C0]/50"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:outline-none focus:border-[#CEA17A]/50"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="planned">Planned</option>
                  </select>
                  <select
                    value={filterAccess}
                    onChange={(e) => setFilterAccess(e.target.value as any)}
                    className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:outline-none focus:border-[#CEA17A]/50"
                  >
                    <option value="all">All Access</option>
                    <option value="public">Public</option>
                    <option value="authenticated">Authenticated</option>
                    <option value="role-based">Role-based</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAllGroups(true)}
                  className="px-3 py-1 text-sm bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200"
                >
                  Expand All
                </button>
                <button
                  onClick={() => toggleAllGroups(false)}
                  className="px-3 py-1 text-sm bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* API Groups */}
            <div className="space-y-4">
              {API_ACCESS_GROUPS.map((group) => {
                const filteredAPIs = filterAPIs(group.apis)
                const isExpanded = expandedGroups.has(group.name)
                
                if (filteredAPIs.length === 0 && searchQuery) {
                  return null // Hide groups with no matching APIs
                }
                
                return (
                  <div key={group.name} className="bg-[#09171F]/50 rounded-lg border border-[#CEA17A]/20 overflow-hidden">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#3E4E5A]/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{group.icon}</span>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-[#DBD0C0]">{group.name}</h3>
                          <p className="text-sm text-[#CEA17A]/70">{group.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-[#CEA17A] bg-[#CEA17A]/10 px-2 py-1 rounded-full">
                          {filteredAPIs.length} / {group.apis.length} endpoints
                        </span>
                        <svg
                          className={`w-5 h-5 text-[#CEA17A] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Group APIs */}
                    {isExpanded && (
                      <div className="border-t border-[#CEA17A]/20">
                        {filteredAPIs.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-[#3E4E5A]/15">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Method</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Route</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Description</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Access</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-[#CEA17A] uppercase tracking-wider">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#CEA17A]/10">
                                {filteredAPIs.map((api, index) => (
                                  <tr key={`${api.route}-${api.method}-${index}`} className="hover:bg-[#3E4E5A]/5 transition-colors">
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getMethodColor(api.method)}`}>
                                        {api.method}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm text-[#DBD0C0]">{api.route}</td>
                                    <td className="px-4 py-3 text-sm text-[#DBD0C0]/80">{api.description}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getAccessTypeColor(api.accessType)}`}>
                                        {api.accessType}
                                      </span>
                                      {api.requiredRoles && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {api.requiredRoles.map(role => (
                                            <span key={role} className={`px-2 py-0.5 text-xs rounded-full border ${getRoleColor(role)}`}>
                                              {role}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(api.status)}`}>
                                        {api.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[#DBD0C0]/60 max-w-xs">
                                      {api.notes || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="px-6 py-8 text-center text-[#DBD0C0]/50">
                            No APIs match the current filters
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#09171F]/50 rounded-lg border border-[#CEA17A]/20 p-4">
                <div className="text-2xl font-bold text-[#DBD0C0]">{API_ACCESS_GROUPS.length}</div>
                <div className="text-sm text-[#CEA17A]/70">API Groups</div>
              </div>
              <div className="bg-[#09171F]/50 rounded-lg border border-[#CEA17A]/20 p-4">
                <div className="text-2xl font-bold text-[#DBD0C0]">
                  {API_ACCESS_GROUPS.reduce((sum, g) => sum + g.apis.length, 0)}
                </div>
                <div className="text-sm text-[#CEA17A]/70">Total Endpoints</div>
              </div>
              <div className="bg-[#09171F]/50 rounded-lg border border-[#CEA17A]/20 p-4">
                <div className="text-2xl font-bold text-green-400">
                  {API_ACCESS_GROUPS.reduce((sum, g) => sum + g.apis.filter(a => a.status === 'active').length, 0)}
                </div>
                <div className="text-sm text-[#CEA17A]/70">Active APIs</div>
              </div>
              <div className="bg-[#09171F]/50 rounded-lg border border-[#CEA17A]/20 p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {API_ACCESS_GROUPS.reduce((sum, g) => sum + g.apis.filter(a => a.accessType === 'role-based').length, 0)}
                </div>
                <div className="text-sm text-[#CEA17A]/70">Protected APIs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
