'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'

interface Player {
  id: string
  display_name: string
  stage_name?: string
  bio?: string
  profile_pic_url?: string
  base_price: number
  group_name?: string
  is_bowler: boolean
  is_batter: boolean
  is_wicket_keeper: boolean
  bowling_rating?: number
  batting_rating?: number
  wicket_keeping_rating?: number
  created_at: string
  skills?: { [key: string]: string | string[] }
}

const fetcher = async (url: string) => {
  // Get current user for role-based skill filtering
  const currentUser = sessionManager.getUser()
  
  const response = await fetch(url, {
    headers: {
      'Authorization': JSON.stringify(currentUser || { role: 'viewer' })
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch players')
  }
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch players')
  }
  
  return result.data
}

interface SkillFilterInputProps {
  skillName: string
  skillValues: string[]
  selectedValues: string[]
  onSelectionChange: (newValues: string[]) => void
}

function SkillFilterInput({ skillName, skillValues, selectedValues, onSelectionChange }: SkillFilterInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const filteredOptions = skillValues.filter(value =>
    value.toLowerCase().includes(searchValue.toLowerCase())
  )

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value))
    } else {
      onSelectionChange([...selectedValues, value])
    }
  }

  const removeValue = (value: string) => {
    onSelectionChange(selectedValues.filter(v => v !== value))
  }

  return (
    <div className="space-y-2 w-full">
      <label className="text-sm font-semibold text-[#CEA17A] uppercase tracking-wide">
        {skillName}
      </label>
      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Trigger Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full h-[2.5rem] px-3 py-2 border-2 border-[#CEA17A]/30 rounded-lg focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-300 bg-[#19171b]/60 backdrop-blur-sm shadow-lg flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedValues.length === 0 ? (
              <span className="text-[#CEA17A]/50 text-sm">Select {skillName.toLowerCase()}...</span>
            ) : (
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
                {selectedValues.slice(0, 2).map(value => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#CEA17A]/20 text-[#CEA17A] border border-[#CEA17A]/30 rounded text-xs whitespace-nowrap flex-shrink-0"
                  >
                    {value}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeValue(value)
                      }}
                      className="hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedValues.length > 2 && (
                  <span className="text-[#CEA17A] text-xs flex-shrink-0">
                    +{selectedValues.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Dropdown Arrow */}
          <svg 
            className={`w-4 h-4 text-[#CEA17A]/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Dropdown Options with Checkboxes */}
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-[#19171b] border border-[#CEA17A]/30 rounded-lg shadow-xl max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-[#CEA17A]/20">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`Search ${skillName.toLowerCase()}...`}
                className="w-full px-3 py-2 bg-[#19171b]/80 border border-[#CEA17A]/30 rounded text-[#DBD0C0] text-sm placeholder-[#CEA17A]/50 focus:ring-2 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Options List */}
            <div className="max-h-48 overflow-y-auto scrollbar-hide">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(value => (
                  <label
                    key={value}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#CEA17A]/10 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(value)}
                      onChange={() => toggleValue(value)}
                      className="w-4 h-4 text-[#CEA17A] bg-[#19171b] border-[#CEA17A]/30 rounded focus:ring-[#CEA17A]/20 focus:ring-2"
                    />
                    <span className="text-[#DBD0C0] text-sm flex-1">{value}</span>
                  </label>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-[#CEA17A]/50 text-sm">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Count Badge */}
        {selectedValues.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
            {selectedValues.length}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [skillFilters, setSkillFilters] = useState<Record<string, string[]>>({})
  const [availableSkills, setAvailableSkills] = useState<Record<string, string[]>>({})
  const [visibleSkills, setVisibleSkills] = useState<string[]>([])
  const [showFilterSettings, setShowFilterSettings] = useState(false)
  const [showFilterBar, setShowFilterBar] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  const { data: players, error, isLoading, mutate } = useSWR<Player[]>('/api/players-public', fetcher)

  // Get user info for permissions
  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoadingUser(true)
        const currentUser = sessionManager.getUser()
        if (currentUser) {
          setUser(currentUser)
          setUserRole(currentUser.role || null)
        } else {
          setUser(null)
          setUserRole(null)
        }
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
        setUserRole(null)
      } finally {
        setIsLoadingUser(false)
      }
    }
    getUser()

    // Listen for auth changes
    const unsubscribe = sessionManager.subscribe((userData) => {
      if (userData) {
        setUser(userData)
        setUserRole(userData.role || null)
      } else {
        setUser(null)
        setUserRole(null)
      }
      setIsLoadingUser(false)
    })

    return () => unsubscribe()
  }, [])

  // Populate available skills from players data
  useEffect(() => {
    if (players) {
      const skillsMap: Record<string, Set<string>> = {}
      
      players.forEach(player => {
        if (player.skills) {
          Object.entries(player.skills).forEach(([skillName, skillValue]) => {
            if (!skillsMap[skillName]) {
              skillsMap[skillName] = new Set()
            }
            
            if (Array.isArray(skillValue)) {
              skillValue.forEach(value => {
                if (value && value.toString().trim()) {
                  skillsMap[skillName].add(value.toString())
                }
              })
            } else if (skillValue && skillValue.toString().trim()) {
              skillsMap[skillName].add(skillValue.toString())
            }
          })
        }
      })
      
      // Convert sets to arrays and sort
      const skillsWithValues: Record<string, string[]> = {}
      Object.entries(skillsMap).forEach(([skillName, values]) => {
        if (values.size > 0) {
          skillsWithValues[skillName] = Array.from(values).sort()
        }
      })
      
      setAvailableSkills(skillsWithValues)
      
      // Set initial visible skills (first 5 skills)
      const skillNames = Object.keys(skillsWithValues)
      setVisibleSkills(skillNames.slice(0, 5))
    }
  }, [players])


  const filteredPlayers = players?.filter(player => {
    const matchesSearch = player.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.stage_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Check all skill filters
    const matchesAllSkills = Object.entries(skillFilters).every(([skillName, selectedValues]) => {
      if (selectedValues.length === 0) return true // No filter applied
      
      const playerSkillValue = player.skills?.[skillName]
      if (!playerSkillValue) return false
      
      if (Array.isArray(playerSkillValue)) {
        return selectedValues.some(selectedValue => 
          playerSkillValue.some(playerValue => 
            playerValue.toString().toLowerCase().includes(selectedValue.toLowerCase()) ||
            selectedValue.toLowerCase().includes(playerValue.toString().toLowerCase())
          )
        )
      } else {
        return selectedValues.some(selectedValue => 
          playerSkillValue.toString().toLowerCase().includes(selectedValue.toLowerCase()) ||
          selectedValue.toLowerCase().includes(playerSkillValue.toString().toLowerCase())
        )
      }
    })
    
    return matchesSearch && matchesAllSkills
  })?.sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.display_name.localeCompare(b.display_name)
        break
      case 'base_price':
        const aPrice = a.skills?.['Base Price'] ? parseInt(a.skills['Base Price'] as string) || 0 : 0
        const bPrice = b.skills?.['Base Price'] ? parseInt(b.skills['Base Price'] as string) || 0 : 0
        comparison = aPrice - bPrice
        break
      default:
        return 0
    }
    
    return sortDirection === 'desc' ? -comparison : comparison
  })


  const handleDelete = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to delete ${playerName}? This action cannot be undone.`)) {
      return
    }

    try {
      const currentUser = sessionManager.getUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': JSON.stringify(currentUser)
        }
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete player')
      }

      // Refresh the players list
      mutate()
    } catch (error: any) {
      console.error('Error deleting player:', error)
      alert(`Error: ${error.message}`)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#19171b] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h2 className="text-lg font-semibold">Error loading players</h2>
                <p className="text-sm mt-1">{error.message}</p>
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
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#DBD0C0] mb-2 sm:mb-4">
                Player Roster
              </h1>
            <p className="text-[#CEA17A] text-base sm:text-lg">
                Discover talented cricketers and build your dream team
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="bg-[#09171F]/50 rounded-lg px-4 py-2 shadow-sm border border-[#CEA17A]/20 w-full sm:w-auto">
                <span className="text-sm text-[#CEA17A]">
                  {isLoading ? 'Loading...' : `${filteredPlayers?.length || 0} players`}
                </span>
              </div>
              {isLoadingUser ? (
              <div className="bg-[#09171F]/50 animate-pulse px-4 py-2 rounded-lg h-10 w-full sm:w-24 border border-[#CEA17A]/20"></div>
              ) : (userRole === 'admin' || userRole === 'host') ? (
                <button
                  onClick={() => router.push('/players/create')}
                className="bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium px-4 py-2 w-full sm:w-auto"
                >
                  Add Player
                </button>
              ) : null}
          </div>
        </div>

        {/* Search and Sort Row */}
        <div className="bg-gradient-to-r from-[#19171b]/40 to-[#2b0307]/40 backdrop-blur-md rounded-2xl p-6 border border-[#CEA17A]/20 shadow-xl mb-4 relative z-20">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#CEA17A]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search players by name..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#CEA17A]/30 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-300 bg-[#19171b]/60 backdrop-blur-sm text-[#DBD0C0] placeholder-[#CEA17A]/50"
                  />
                </div>
              </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              {/* Sort Direction Icons - Side by Side */}
              <div className="flex">
                <button
                  onClick={() => setSortDirection('asc')}
                  className={`px-2 py-2 border-2 border-[#CEA17A]/30 rounded-l-lg transition-all duration-200 ${
                    sortDirection === 'asc' 
                      ? 'bg-[#CEA17A] text-[#09171F] border-[#CEA17A]' 
                      : 'bg-[#19171b]/60 text-[#DBD0C0] hover:bg-[#CEA17A]/20'
                  }`}
                  title="Sort Ascending"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setSortDirection('desc')}
                  className={`px-2 py-2 border-2 border-[#CEA17A]/30 rounded-r-lg border-l-0 transition-all duration-200 ${
                    sortDirection === 'desc' 
                      ? 'bg-[#CEA17A] text-[#09171F] border-[#CEA17A]' 
                      : 'bg-[#19171b]/60 text-[#DBD0C0] hover:bg-[#CEA17A]/20'
                  }`}
                  title="Sort Descending"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
            </div>

              {/* Sort Field Input */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border-2 border-[#CEA17A]/30 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-300 bg-[#19171b]/60 backdrop-blur-sm text-[#DBD0C0] text-sm"
                >
                  <option value="name">Name</option>
                <option value="base_price">Base Price</option>
                </select>
              </div>

            {/* View Toggle - Desktop Only */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-semibold text-[#CEA17A] uppercase tracking-wide">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] shadow-[#CEA17A]/30'
                    : 'bg-[#19171b]/60 text-[#DBD0C0] hover:bg-[#CEA17A]/20 border border-[#CEA17A]/30'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] shadow-[#CEA17A]/30'
                    : 'bg-[#19171b]/60 text-[#DBD0C0] hover:bg-[#CEA17A]/20 border border-[#CEA17A]/30'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSkillFilters({})
                }}
                className="w-full sm:w-auto px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#3E4E5A]/25 rounded-xl hover:bg-[#3E4E5A]/25 hover:border-[#3E4E5A]/40 transition-all duration-300 shadow-lg backdrop-blur-sm text-sm font-medium"
                title="Clear all filters"
              >
                Clear Filters
              </button>

              {/* Toggle Filter Bar */}
              <button
                onClick={() => setShowFilterBar(!showFilterBar)}
                className="w-full sm:w-auto px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#3E4E5A]/25 rounded-xl hover:bg-[#3E4E5A]/25 hover:border-[#3E4E5A]/40 transition-all duration-300 shadow-lg backdrop-blur-sm text-sm font-medium"
                title={showFilterBar ? "Hide filter bar" : "Show filter bar"}
              >
                {showFilterBar ? 'Hide Filters' : 'Show Filters'}
              </button>

              {/* Filter Settings */}
              <button
                onClick={() => setShowFilterSettings(true)}
                className="w-full sm:w-auto px-4 py-3 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#3E4E5A]/25 rounded-xl hover:bg-[#3E4E5A]/25 hover:border-[#3E4E5A]/40 transition-all duration-300 shadow-lg backdrop-blur-sm text-sm font-medium flex items-center justify-center sm:justify-start"
                title="Filter Settings"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar Row */}
        {showFilterBar && (
          <div className="bg-gradient-to-r from-[#19171b]/40 to-[#2b0307]/40 backdrop-blur-md rounded-2xl p-6 border border-[#CEA17A]/20 shadow-xl mb-8 relative z-20">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Dynamic Skills Filters */}
            {visibleSkills.length > 0 && (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                {visibleSkills.map(skillName => (
                  <SkillFilterInput
                    key={skillName}
                    skillName={skillName}
                    skillValues={availableSkills[skillName] || []}
                    selectedValues={skillFilters[skillName] || []}
                    onSelectionChange={(newValues) => {
                      setSkillFilters(prev => ({
                        ...prev,
                        [skillName]: newValues
                      }))
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* View Toggle Tab Bar - Mobile Only */}
        <div className="sm:hidden mb-6">
          <div className="bg-gradient-to-r from-[#19171b]/40 to-[#2b0307]/40 backdrop-blur-md rounded-2xl p-4 border border-[#CEA17A]/20 shadow-xl">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-semibold text-[#CEA17A] uppercase tracking-wide mr-4">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] shadow-[#CEA17A]/30'
                    : 'bg-[#19171b]/60 text-[#DBD0C0] hover:bg-[#CEA17A]/20 border border-[#CEA17A]/30'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] shadow-[#CEA17A]/30'
                    : 'bg-[#19171b]/60 text-[#DBD0C0] hover:bg-[#CEA17A]/20 border border-[#CEA17A]/30'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Players Display */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
              <p className="text-[#CEA17A]">Loading players...</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4 justify-items-stretch">
            {filteredPlayers?.map((player) => (
              <div 
                key={player.id} 
                onClick={() => router.push(`/players/${player.id}`)}
                className="group relative aspect-square overflow-hidden bg-gradient-to-br from-[#3E4E5A] to-[#09171F] rounded-xl shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-300 cursor-pointer z-[-1]"
              >
                {/* Player Image Background */}
                  {player.profile_pic_url ? (
                    <img
                      src={player.profile_pic_url}
                      alt={player.display_name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                    <div className="text-6xl text-[#CEA17A]/60">🏏</div>
                    </div>
                  )}
                  
                
                {/* Action Buttons - Top Right */}
                {(userRole === 'admin' || userRole === 'host') && (
                  <div className="absolute top-3 right-3 flex space-x-1 z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/players/${player.id}/edit`)
                      }}
                      className="bg-black/50 text-white border border-white/20 shadow-lg backdrop-blur-sm rounded-lg hover:bg-black/70 hover:border-white/40 transition-all duration-150 text-xs py-1 px-2"
                      title="Edit Player"
                    >
                      ✏️
                    </button>
                    {userRole === 'admin' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(player.id, player.display_name)
                        }}
                        className="bg-red-500/80 text-white border border-red-400/50 shadow-lg backdrop-blur-sm rounded-lg hover:bg-red-600/80 hover:border-red-300/70 transition-all duration-150 text-xs py-1 px-2"
                        title="Delete Player"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
                  
                {/* Group Badge - Top Left */}
                  {player.group_name && (
                  <div className="absolute top-3 left-3 bg-black/50 text-white border border-white/20 px-2 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm z-10">
                      {player.group_name}
                    </div>
                  )}

                {/* Player Name - Bottom Left with Gradient Background */}
                <div className="absolute bottom-0 left-0 right-0 z-10">
                  <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 sm:p-4 pb-2 sm:pb-3">
                    <h3 className="text-white font-semibold text-xs sm:text-sm mb-1 sm:mb-2">
                      {player.display_name}
                    </h3>
                    
                    {/* Role Icons */}
                    {player.skills?.Role && (
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {Array.isArray(player.skills.Role) ? (
                          player.skills.Role.map((role, index) => {
                            const roleEmoji = role.toLowerCase().includes('batter') ? '🏏' : 
                                            role.toLowerCase().includes('bowler') ? '🎾' : 
                                            role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk') ? '🧤' : '🧤'
                      return (
                              <span key={index} className="text-sm sm:text-base">
                                {roleEmoji}
                      </span>
                            )
                          })
                        ) : (
                          (() => {
                            const role = player.skills.Role
                            const roleEmoji = role.toLowerCase().includes('batter') ? '🏏' : 
                                            role.toLowerCase().includes('bowler') ? '🎾' : 
                                            role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk') ? '🧤' : '🧤'
                      return (
                              <span className="text-sm sm:text-base">
                                {roleEmoji}
                        </span>
                            )
                          })()
                      )}
                      </div>
                    )}
                          </div>
                        </div>
                      </div>
            ))}
                        </div>
                      ) : (
          <div className="bg-gradient-to-r from-[#19171b]/40 to-[#2b0307]/40 backdrop-blur-md rounded-2xl border border-[#CEA17A]/20 shadow-xl overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-[#CEA17A]/10 to-[#CEA17A]/5 border-b border-[#CEA17A]/20">
              <div className={`grid gap-2 sm:gap-4 p-2 sm:p-4 text-xs font-semibold text-[#CEA17A] uppercase tracking-wide ${
                (userRole === 'admin' || userRole === 'host') 
                  ? 'grid-cols-8' 
                  : 'grid-cols-8'
              }`}>
                <div className="col-span-1 sm:col-span-1"></div>
                <div className="col-span-3 sm:col-span-2">Name</div>
                <div className="col-span-1 sm:col-span-1">Role</div>
                <div className="col-span-2 sm:col-span-2">Community</div>
                {(userRole === 'admin' || userRole === 'host') && (
                  <div className="col-span-1 sm:col-span-1 text-right">Price</div>
                )}
                {!(userRole === 'admin' || userRole === 'host') && (
                  <div className="col-span-2 sm:col-span-1"></div>
                )}
                    </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[#CEA17A]/10">
              {filteredPlayers?.map((player) => (
                <div 
                  key={player.id} 
                      onClick={() => router.push(`/players/${player.id}`)}
                  className={`grid gap-1 sm:gap-4 p-2 sm:p-4 hover:bg-[#CEA17A]/5 transition-all duration-200 cursor-pointer group ${
                    (userRole === 'admin' || userRole === 'host') 
                      ? 'grid-cols-8' 
                      : 'grid-cols-8'
                  }`}
                >
                  {/* Photo */}
                  <div className="col-span-1 sm:col-span-1 flex items-center">
                    <div className="h-6 w-6 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-[#3E4E5A] to-[#09171F] flex items-center justify-center overflow-hidden border border-[#CEA17A]/20">
                      {player.profile_pic_url ? (
                        <img
                          src={player.profile_pic_url}
                          alt={player.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-xs sm:text-base text-[#CEA17A]/60">🏏</div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="col-span-3 sm:col-span-2 flex items-center min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-base font-medium text-[#DBD0C0] group-hover:text-[#CEA17A] transition-colors truncate">
                        {player.display_name}
                      </div>
                      {player.stage_name && (
                        <div className="text-xs text-[#CEA17A]/70 italic truncate">"{player.stage_name}"</div>
                      )}
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-1 sm:col-span-1 flex items-center">
                    <div className="flex gap-0.5">
                      {player.skills?.Role ? (
                        Array.isArray(player.skills.Role) ? (
                          player.skills.Role.map((role, index) => {
                            const roleEmoji = role.toLowerCase().includes('batter') ? '🏏' : 
                                            role.toLowerCase().includes('bowler') ? '🎾' : 
                                            role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk') ? '🧤' : '🧤'
                            return (
                              <span key={index} className="text-xs sm:text-base" title={role}>
                                {roleEmoji}
                              </span>
                            )
                          })
                        ) : (
                          (() => {
                            const role = player.skills.Role
                            const roleEmoji = role.toLowerCase().includes('batter') ? '🏏' : 
                                            role.toLowerCase().includes('bowler') ? '🎾' : 
                                            role.toLowerCase().includes('wicket') || role.toLowerCase().includes('wk') ? '🧤' : '🧤'
                            return (
                              <span className="text-xs sm:text-base" title={role}>
                                {roleEmoji}
                              </span>
                            )
                          })()
                        )
                      ) : (
                        <span className="text-[#CEA17A]/50 text-xs">-</span>
                      )}
                    </div>
                  </div>

                  {/* Community */}
                  <div className="col-span-2 sm:col-span-2 flex items-center">
                    <div className="flex items-center gap-1 max-w-full overflow-hidden">
                      {player.skills?.Community ? (
                        Array.isArray(player.skills.Community) ? (
                          player.skills.Community.length > 1 ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-block bg-[#CEA17A]/20 text-[#CEA17A] border border-[#CEA17A]/30 text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[60px] sm:max-w-[80px]">
                                {player.skills.Community[0]}
                            </span>
                            <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Show all communities in a tooltip or modal
                                  const communities = Array.isArray(player.skills?.Community) ? player.skills.Community : [player.skills?.Community]
                                  alert(`Communities: ${communities.join(', ')}`)
                                }}
                                className="text-[#CEA17A] text-xs hover:text-[#CEA17A]/80 transition-colors"
                                title={`View all communities: ${Array.isArray(player.skills?.Community) ? player.skills.Community.join(', ') : player.skills?.Community}`}
                              >
                                +{player.skills.Community.length - 1}
                            </button>
                          </div>
                        ) : (
                            <span className="inline-block bg-[#CEA17A]/20 text-[#CEA17A] border border-[#CEA17A]/30 text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[60px] sm:max-w-[80px]">
                              {player.skills.Community[0]}
                            </span>
                          )
                        ) : (
                          <span className="inline-block bg-[#CEA17A]/20 text-[#CEA17A] border border-[#CEA17A]/30 text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[60px] sm:max-w-[80px]">
                            {player.skills.Community}
                          </span>
                        )
                      ) : (
                        <span className="text-[#CEA17A]/50 text-xs">-</span>
                        )}
                      </div>
                  </div>

                  {/* Base Price */}
                  {(userRole === 'admin' || userRole === 'host') && (
                    <div className="col-span-1 sm:col-span-1 flex items-center justify-end">
                      <div className="text-xs sm:text-base font-semibold text-[#CEA17A]">
                        ₹{player.base_price}
                      </div>
                    </div>
                  )}

                  {/* Empty space for regular users */}
                  {!(userRole === 'admin' || userRole === 'host') && (
                    <div className="col-span-1 sm:col-span-1"></div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPlayers?.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-[#09171F]/50 rounded-xl shadow-sm border border-[#CEA17A]/20 p-12 max-w-md mx-auto">
              <div className="text-6xl mb-6">🏏</div>
              <h3 className="text-xl font-semibold text-[#DBD0C0] mb-2">
                No players found
              </h3>
              <p className="text-[#CEA17A] mb-6">
                Try adjusting your search filters or check back later for new players.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('')
                  setSkillFilters({})
                }}
                className="bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium px-6 py-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Filter Settings Modal */}
        {showFilterSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#09171F] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[#CEA17A]/30">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#CEA17A]/20">
                <h2 className="text-xl font-semibold text-white mb-2">Filter Settings</h2>
                <p className="text-[#CEA17A] text-sm">Choose which skills to display in the filter bar (max 5)</p>
              </div>

              {/* Skills Selection */}
              <div className="p-6">
                <div className="grid grid-cols-1 gap-3">
                  {Object.keys(availableSkills).map(skillName => (
                    <label key={skillName} className="flex items-center space-x-3 p-3 rounded-lg border border-[#CEA17A]/20 hover:bg-[#CEA17A]/10 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleSkills.includes(skillName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (visibleSkills.length < 5) {
                              setVisibleSkills([...visibleSkills, skillName])
                            }
                          } else {
                            setVisibleSkills(visibleSkills.filter(s => s !== skillName))
                          }
                        }}
                        disabled={!visibleSkills.includes(skillName) && visibleSkills.length >= 5}
                        className="w-4 h-4 text-[#CEA17A] bg-[#19171b] border-[#CEA17A]/30 rounded focus:ring-[#CEA17A]/20 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <span className="text-[#DBD0C0] text-sm font-medium">{skillName}</span>
                        <div className="text-xs text-[#CEA17A]/70">
                          {availableSkills[skillName]?.length || 0} values
                        </div>
                      </div>
                      {visibleSkills.includes(skillName) && (
                        <div className="text-xs text-[#CEA17A] font-medium">
                          {visibleSkills.indexOf(skillName) + 1}
                        </div>
                      )}
                    </label>
                  ))}
                </div>

                {Object.keys(availableSkills).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[#CEA17A]">No skills found in player data</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#CEA17A]/20 flex justify-end space-x-3">
                <button
                  onClick={() => setShowFilterSettings(false)}
                  className="px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#3E4E5A]/25 rounded-lg hover:bg-[#3E4E5A]/25 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Reset to first 5 skills
                    const skillNames = Object.keys(availableSkills)
                    setVisibleSkills(skillNames.slice(0, 5))
                    setShowFilterSettings(false)
                  }}
                  className="px-4 py-2 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded-lg hover:bg-[#CEA17A]/25 transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
