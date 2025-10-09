'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'
import { PermissionService } from '@/src/lib/permissions'

interface TournamentFormData {
  name: string
  format: string
  tournament_datetime: string
  description: string
  total_slots: number
  venue: string
  google_maps_link: string
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showDateTimePicker, setShowDateTimePicker] = useState(false)
  const [dateTimeStep, setDateTimeStep] = useState<'date' | 'time'>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState({ hour: 7, minute: 0 })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    format: '8 Team',
    tournament_datetime: '',
    description: '',
    total_slots: 88,
    venue: '',
    google_maps_link: ''
  })

  // Check if user is authenticated and has permission to create tournaments
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get user from session manager
        const sessionUser = sessionManager.getUser()
        if (sessionUser) {
          // Fetch user profile to get role and status
          const response = await fetch(`/api/user-profile?userId=${sessionUser.id}`)
          const result = await response.json()
          
          if (result.success) {
            const userData = result.data
            setUserRole(userData?.role || null)
            
            // Check permissions using the permission service
            if (PermissionService.canCreateTournaments(userData)) {
              setUser(sessionUser)
            } else if (PermissionService.isPending(userData)) {
              setMessage('Your account is pending admin approval. You cannot create tournaments until approved.')
            } else {
              setMessage('Only hosts and admins can create tournaments. Your current role: ' + (userData?.role || 'unknown'))
            }
          } else {
            setMessage('Error fetching user data. Please try again.')
          }
        } else {
          setMessage('Please sign in to create tournaments')
        }
      } catch (error) {
        console.error('Error checking user:', error)
        setMessage('Error checking authentication status')
      } finally {
        setIsLoadingUser(false)
      }
    }
    checkUser()

    // Subscribe to session changes
    const unsubscribe = sessionManager.subscribe((sessionUser) => {
      if (sessionUser) {
        // Re-check permissions when user changes
        checkUser()
      } else {
        setUser(null)
        setUserRole(null)
        setMessage('Please sign in to create tournaments')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Get team count based on format
  const getTeamCount = (format: string): number => {
    const formatMap: { [key: string]: number } = {
      'Bilateral': 2,
      'TriSeries': 3,
      'Quad': 4,
      '6 Team': 6,
      '8 Team': 8,
      '10 Team': 10,
      '12 Team': 12,
      '16 Team': 16
    }
    return formatMap[format] || 8
  }

  // Date-time picker functions
  const openDateTimePicker = () => {
    setDateTimeStep('date')
    // Parse current datetime if it exists
    if (formData.tournament_datetime) {
      const date = new Date(formData.tournament_datetime)
      setSelectedDate(date)
      setSelectedTime({ hour: date.getHours(), minute: date.getMinutes() })
      setCurrentMonth(date) // Set calendar to show the selected date's month
    } else {
      const today = new Date()
      setSelectedDate(today)
      setCurrentMonth(today) // Set calendar to show current month
    }
    setShowDateTimePicker(true)
  }

  const handleDateNext = () => {
    if (selectedDate) {
      setDateTimeStep('time')
    }
  }

  const handleTimeBack = () => {
    setDateTimeStep('date')
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTimeSelect = (hour: number, minute: number) => {
    setSelectedTime({ hour, minute })
  }

  const confirmDateTime = () => {
    if (selectedDate) {
      // Create datetime in local timezone to avoid UTC conversion issues
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const day = selectedDate.getDate()
      const hour = selectedTime.hour
      const minute = selectedTime.minute
      
      // Create a Date object with the selected local time
      const localDateTime = new Date(year, month, day, hour, minute, 0, 0)
      
      // Get timezone offset in minutes and convert to hours
      const timezoneOffset = localDateTime.getTimezoneOffset()
      const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60)
      const timezoneMinutes = Math.abs(timezoneOffset) % 60
      const timezoneSign = timezoneOffset <= 0 ? '+' : '-'
      
      // Format as YYYY-MM-DDTHH:MM:SS with timezone offset
      const formattedDateTime = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${timezoneSign}${String(timezoneHours).padStart(2, '0')}:${String(timezoneMinutes).padStart(2, '0')}`
      
      // Debug: Log the datetime being stored
      console.log('Selected time:', `${hour}:${String(minute).padStart(2, '0')}`)
      console.log('Formatted datetime:', formattedDateTime)
      console.log('Timezone offset:', timezoneOffset, 'minutes')
      
      setFormData(prev => ({
        ...prev,
        tournament_datetime: formattedDateTime
      }))
    }
    setShowDateTimePicker(false)
    setDateTimeStep('date')
  }

  const formatDateTime = (datetimeString: string) => {
    if (!datetimeString) return 'Select date and time'
    const date = new Date(datetimeString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create tournament via API
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(user)
        },
        body: JSON.stringify({
          name: formData.name,
          format: formData.format,
          selected_teams: getTeamCount(formData.format),
          tournament_date: formData.tournament_datetime,
          description: formData.description,
          total_slots: formData.total_slots,
          host_id: user.id,
          status: 'draft',
          venue: formData.venue,
          google_maps_link: formData.google_maps_link
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tournament')
      }

      const result = await response.json()
      const tournament = result.tournament

      setMessage('Tournament created successfully!')
      setShowConfirmDialog(false)
      
      // Redirect to tournament details page
      setTimeout(() => {
        router.push(`/tournaments/${tournament.id}`)
      }, 2000)

    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name.includes('slots') || name.includes('amount') || name.includes('increment') 
          ? Number(value) 
          : value
      }
      
      // Auto-update total slots when format changes
      if (name === 'format') {
        const teamCount = getTeamCount(value)
        newData.total_slots = teamCount * 8 // 8 players per team
      }
      
      return newData
    })
  }

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#19171b] py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-[#DBD0C0] mb-2">
                Checking Access...
              </h2>
              <p className="text-[#CEA17A]">
                Verifying your permissions to create tournaments
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied if user is not authenticated or doesn't have permission
  if (!user) {
    return (
      <div className="min-h-screen bg-[#19171b] py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4">
                Access Denied
              </h2>
              <p className="text-[#CEA17A] mb-6">
                {message || 'You need to be a host or admin to create tournaments.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/signin')}
                    className="px-6 py-3 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
                  >
                    Sign In
                  </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
                >
                  Go Home
                </button>
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
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-left mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#DBD0C0] mb-2 sm:mb-4">Create New Tournament</h1>
        </div>

        {/* Form */}
        <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
          <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-[#CEA17A]/20">
            <h2 className="text-lg sm:text-2xl font-bold text-[#DBD0C0]">Tournament Configuration</h2>
          </div>
          
          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Tournament Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-[#CEA17A]">
                    Tournament Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      autoComplete="off"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-12 border-2 border-[#CEA17A]/30 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 text-[#DBD0C0] text-sm sm:text-base backdrop-blur-sm autofill:bg-[#19171b] autofill:text-[#DBD0C0]"
                      placeholder="Enter a memorable tournament name"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 z-10">
                      <svg className="w-5 h-5 text-[#CEA17A]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>

              {/* Tournament Format */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-[#CEA17A]">
                  Tournament Format *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { value: 'Bilateral', label: 'Bi-Lateral', teams: 2, color: 'from-slate-400 to-slate-500' },
                    { value: 'TriSeries', label: 'Tri-Series', teams: 3, color: 'from-stone-400 to-stone-500' },
                    { value: 'Quad', label: 'Quad Series', teams: 4, color: 'from-neutral-400 to-neutral-500' },
                    { value: '6 Team', label: '6 Team', teams: 6, color: 'from-zinc-400 to-zinc-500' },
                    { value: '8 Team', label: '8 Team', teams: 8, color: 'from-gray-400 to-gray-500' },
                    { value: '10 Team', label: '10 Team', teams: 10, color: 'from-slate-500 to-slate-600' },
                    { value: '12 Team', label: '12 Team', teams: 12, color: 'from-stone-500 to-stone-600' },
                    { value: '16 Team', label: '16 Team', teams: 16, color: 'from-neutral-500 to-neutral-600' }
                  ].map((format) => (
                    <div
                      key={format.value}
                      className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                        formData.format === format.value
                          ? 'border-green-400/50 bg-green-500/20 shadow-lg'
                          : 'border-[#CEA17A]/20 hover:border-[#CEA17A]/40 hover:shadow-lg'
                      }`}
                      onClick={() => handleInputChange({ target: { name: 'format', value: format.value } } as any)}
                    >
                      {/* Luxury Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#09171F]/60 via-transparent to-[#3E4E5A]/30 rounded-xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
                      
                      <div className="relative z-10 p-2 sm:p-4">
                        <div className="text-center">
                          <div className="text-lg sm:text-2xl font-bold text-white">{format.teams}</div>
                          <div className="text-xs sm:text-sm text-[#CEA17A]">{format.label}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tournament Date & Time */}
              <div className="space-y-2">
                <label htmlFor="tournament_datetime" className="block text-sm font-semibold text-[#CEA17A]">
                  Tournament Date & Time *
                </label>
                <div
                  onClick={openDateTimePicker}
                  className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] cursor-pointer hover:border-[#CEA17A]/40 flex items-center justify-between"
                >
                  <span className={formData.tournament_datetime ? 'text-[#DBD0C0]' : 'text-[#CEA17A]/60'}>
                    {formatDateTime(formData.tournament_datetime)}
                  </span>
                  <svg className="w-5 h-5 text-[#CEA17A]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs text-[#CEA17A]/70">
                  Click anywhere to select date and time for your tournament
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-[#CEA17A]">
                  Tournament Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] resize-none"
                  placeholder="Describe your tournament, rules, prizes, or any special information..."
                />
              </div>

              {/* Total Slots */}
              <div className="space-y-2">
                <label htmlFor="total_slots" className="block text-sm font-semibold text-[#CEA17A]">
                  Total Player Slots *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="total_slots"
                    name="total_slots"
                    value={formData.total_slots}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="128"
                    className="w-full px-4 py-3 pr-12 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                    placeholder="Total player slots"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-[#CEA17A]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] border border-[#CEA17A]/20 rounded-lg p-3">
                  <p className="text-sm text-[#CEA17A]">
                    <span className="font-semibold">Recommended:</span> {getTeamCount(formData.format) * 8} slots ({getTeamCount(formData.format)} teams × 8 players per team)
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <label htmlFor="venue" className="block text-sm font-semibold text-[#CEA17A]">
                  Venue
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                  placeholder="e.g., Community Center, Sports Complex, etc."
                />
              </div>

              {/* Google Maps Link */}
              <div className="space-y-2">
                <label htmlFor="google_maps_link" className="block text-sm font-semibold text-[#CEA17A]">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  id="google_maps_link"
                  name="google_maps_link"
                  value={formData.google_maps_link}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-xs text-[#CEA17A]/70">
                  Optional: Share a Google Maps link to help players find the venue location
                </p>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-xl border-2 ${
                  message.includes('Error') 
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-5 h-5 mr-3 ${
                      message.includes('Error') ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {message.includes('Error') ? (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}

              {/* Submit Section */}
              <div className="bg-gradient-to-r from-[#CEA17A]/10 to-[#CEA17A]/5 rounded-xl p-6 border-2 border-[#CEA17A]/20">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-[#DBD0C0]">Ready to Create?</h3>
                    <p className="text-sm text-[#CEA17A]">Review your settings and create your tournament</p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="w-full sm:w-auto px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={loading}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg sm:rounded-xl hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm sm:text-base"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Review and Create
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Modern Date-Time Picker Modal */}
      {showDateTimePicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden bg-[#09171F] rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 scale-100 border border-[#CEA17A]/30">
            {/* Luxury Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#09171F]/60 via-transparent to-[#3E4E5A]/30 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {dateTimeStep === 'date' ? 'Select Date' : 'Select Time'}
                </h3>
                <button
                  onClick={() => {
                    setShowDateTimePicker(false)
                    setDateTimeStep('date')
                  }}
                  className="text-[#CEA17A] hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Date Selection - Calendar View */}
              {dateTimeStep === 'date' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#CEA17A] mb-3">Select Date</label>
                
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 text-[#CEA17A] hover:text-white hover:bg-[#CEA17A]/20 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h4 className="text-lg font-semibold text-white">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 text-[#CEA17A] hover:text-white hover:bg-[#CEA17A]/20 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="mb-4">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-[#CEA17A] py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
                      <div key={`empty-${index}`} className="h-10"></div>
                    ))}
                    
                    {/* Days of the month */}
                    {Array.from({ length: getDaysInMonth(currentMonth) }, (_, index) => {
                      const day = index + 1
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                      const isPast = isPastDate(date)
                      const isCurrentDay = isToday(date)
                      const isSelectedDay = isSelected(date)
                      
                      return (
                        <button
                          key={day}
                          onClick={() => !isPast && handleDateSelect(date)}
                          disabled={isPast}
                          className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSelectedDay
                              ? 'bg-[#CEA17A] text-[#09171F] font-bold shadow-lg'
                              : isCurrentDay
                              ? 'bg-[#CEA17A]/30 text-[#CEA17A] font-semibold'
                              : isPast
                              ? 'text-gray-500 cursor-not-allowed opacity-50'
                              : 'text-[#DBD0C0] hover:bg-[#CEA17A]/20 hover:text-white'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                {/* Quick Date Options */}
                <div className="space-y-3">
                  <p className="text-[#CEA17A] text-sm font-medium">Quick Select:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const today = new Date()
                      const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                      
                      // Calculate days until next Saturday and Sunday
                      const daysUntilSaturday = (6 - currentDay) % 7 || 7
                      const daysUntilSunday = (7 - currentDay) % 7 || 7
                      const daysUntilNextSaturday = daysUntilSaturday + 7
                      const daysUntilNextSunday = daysUntilSunday + 7
                      
                      const options = [
                        { 
                          label: 'This Saturday', 
                          days: daysUntilSaturday,
                          date: new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000)
                        },
                        { 
                          label: 'This Sunday', 
                          days: daysUntilSunday,
                          date: new Date(today.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000)
                        },
                        { 
                          label: 'Next Saturday', 
                          days: daysUntilNextSaturday,
                          date: new Date(today.getTime() + daysUntilNextSaturday * 24 * 60 * 60 * 1000)
                        },
                        { 
                          label: 'Next Sunday', 
                          days: daysUntilNextSunday,
                          date: new Date(today.getTime() + daysUntilNextSunday * 24 * 60 * 60 * 1000)
                        }
                      ]
                      
                      return options.map((option) => {
                        return (
                          <button
                            key={option.label}
                            onClick={() => {
                              handleDateSelect(option.date)
                              setCurrentMonth(option.date) // Navigate to the selected month
                            }}
                            className="px-3 py-2 bg-[#3E4E5A]/20 hover:bg-[#3E4E5A]/30 text-[#CEA17A] hover:text-white border border-[#CEA17A]/30 hover:border-[#CEA17A]/50 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            {option.label}
                          </button>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>
              )}
              
              {/* Time Selection */}
              {dateTimeStep === 'time' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#CEA17A] mb-3">Select Time</label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Hour Selection */}
                      <div>
                        <label className="block text-xs text-[#CEA17A]/70 mb-2">Hour</label>
                        <select
                          value={selectedTime.hour}
                          onChange={(e) => handleTimeSelect(Number(e.target.value), selectedTime.minute)}
                          className="w-full px-3 py-2 border-2 border-[#CEA17A]/20 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Minute Selection */}
                      <div>
                        <label className="block text-xs text-[#CEA17A]/70 mb-2">Minute</label>
                        <select
                          value={selectedTime.minute}
                          onChange={(e) => handleTimeSelect(selectedTime.hour, Number(e.target.value))}
                          className="w-full px-3 py-2 border-2 border-[#CEA17A]/20 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Time Options */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#CEA17A] mb-3">Quick Select</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Morning', hour: 7, minute: 0 },
                        { label: 'Afternoon', hour: 14, minute: 0 },
                        { label: 'Evening', hour: 17, minute: 0 },
                        { label: 'Night', hour: 20, minute: 0 }
                      ].map((option) => (
                        <button
                          key={option.label}
                          onClick={() => handleTimeSelect(option.hour, option.minute)}
                          className="px-3 py-2 bg-[#3E4E5A]/20 hover:bg-[#3E4E5A]/30 text-[#CEA17A] hover:text-white border border-[#CEA17A]/30 hover:border-[#CEA17A]/50 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Action buttons */}
              <div className="flex gap-3">
                {dateTimeStep === 'date' ? (
                  <>
                    <button
                      onClick={() => {
                        setShowDateTimePicker(false)
                        setDateTimeStep('date')
                      }}
                      className="flex-1 px-4 py-2 bg-[#3E4E5A]/20 hover:bg-[#3E4E5A]/30 text-[#CEA17A] hover:text-white border border-[#CEA17A]/30 hover:border-[#CEA17A]/50 rounded-lg font-medium text-sm transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDateNext}
                      disabled={!selectedDate}
                      className="flex-1 px-4 py-2 bg-[#CEA17A]/20 hover:bg-[#CEA17A]/30 text-white rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleTimeBack}
                      className="flex-1 px-4 py-2 bg-[#3E4E5A]/20 hover:bg-[#3E4E5A]/30 text-[#CEA17A] hover:text-white border border-[#CEA17A]/30 hover:border-[#CEA17A]/50 rounded-lg font-medium text-sm transition-all duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={confirmDateTime}
                      className="flex-1 px-4 py-2 bg-[#CEA17A]/20 hover:bg-[#CEA17A]/30 text-white rounded-lg font-medium text-sm transition-all duration-200"
                    >
                      Confirm
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden bg-[#09171F] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-500 scale-100 border border-[#CEA17A]/30">
            {/* Luxury Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#09171F]/60 via-transparent to-[#3E4E5A]/30 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Confirm Tournament Creation
                </h3>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="text-[#CEA17A] hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Tournament Details */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#19171b]/50 rounded-xl p-4 border border-[#CEA17A]/20">
                    <div className="text-sm font-medium text-[#CEA17A] mb-1">Tournament Name</div>
                    <div className="text-lg font-semibold text-[#DBD0C0]">
                      {formData.name || 'Untitled Tournament'}
                    </div>
                  </div>
                  
                  <div className="bg-[#19171b]/50 rounded-xl p-4 border border-[#CEA17A]/20">
                    <div className="text-sm font-medium text-[#CEA17A] mb-1">Format</div>
                    <div className="text-lg font-semibold text-[#DBD0C0]">{formData.format}</div>
                  </div>
                  
                  <div className="bg-[#19171b]/50 rounded-xl p-4 border border-[#CEA17A]/20">
                    <div className="text-sm font-medium text-[#CEA17A] mb-1">Teams</div>
                    <div className="text-lg font-semibold text-[#DBD0C0]">{getTeamCount(formData.format)}</div>
                  </div>
                  
                  <div className="bg-[#19171b]/50 rounded-xl p-4 border border-[#CEA17A]/20">
                    <div className="text-sm font-medium text-[#CEA17A] mb-1">Player Slots</div>
                    <div className="text-lg font-semibold text-[#DBD0C0]">{formData.total_slots}</div>
                  </div>
                  
                  <div className="bg-[#19171b]/50 rounded-xl p-4 border border-[#CEA17A]/20">
                    <div className="text-sm font-medium text-[#CEA17A] mb-1">Date & Time</div>
                    <div className="text-lg font-semibold text-[#DBD0C0]">
                      {formData.tournament_datetime ? new Date(formData.tournament_datetime).toLocaleString() : 'Not set'}
                    </div>
                  </div>
                  
                  <div className="bg-[#19171b]/50 rounded-xl p-4 border border-[#CEA17A]/20">
                    <div className="text-sm font-medium text-[#CEA17A] mb-1">Status</div>
                    <div className="text-lg font-semibold text-green-400">Draft</div>
                  </div>
                </div>
                
                {formData.description && (
                  <div className="mt-4 bg-[#19171b]/50 rounded-xl p-4 border border-[#CEA17A]/20">
                    <div className="text-sm font-medium text-[#CEA17A] mb-2">Description</div>
                    <div className="text-[#DBD0C0]">{formData.description}</div>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 bg-[#3E4E5A]/20 hover:bg-[#3E4E5A]/30 text-[#CEA17A] hover:text-white border border-[#CEA17A]/30 hover:border-[#CEA17A]/50 rounded-lg font-medium text-sm transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#CEA17A]/20 hover:bg-[#CEA17A]/30 text-white rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </div>
                  ) : (
                    'Create Tournament'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

