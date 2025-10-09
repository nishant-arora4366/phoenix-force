'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthForm from '@/src/components/AuthForm'
import PlayerProfilePrompt from '@/src/components/PlayerProfilePrompt'
import { sessionManager } from '@/src/lib/session'
import { supabase } from '@/src/lib/supabaseClient'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPlayerProfilePrompt, setShowPlayerProfilePrompt] = useState(false)
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false)
  const [stats, setStats] = useState({
    playersRegistered: 0,
    totalTournaments: 0,
    totalUsers: 0,
    activeTournaments: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([])
  const [tournamentsLoading, setTournamentsLoading] = useState(true)

  // User session management
  useEffect(() => {
    const currentUser = sessionManager.getUser()
    setUser(currentUser)
    setIsLoading(false)

    const unsubscribe = sessionManager.subscribe((sessionUser) => {
      setUser(sessionUser)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        
        if (data.success && data.stats) {
          setStats(data.stats)
        } else {
          console.error('Failed to fetch stats:', data.error)
        }
      } catch (error) {
        console.error('Error fetching platform statistics:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Fetch upcoming tournaments
  useEffect(() => {
    const fetchUpcomingTournaments = async () => {
      try {
        const response = await fetch('/api/tournaments')
        const data = await response.json()
        
        if (data.success && data.tournaments) {
          // Filter for upcoming tournaments (registration_open, draft, or registration_closed)
          const upcoming = data.tournaments
            .filter((tournament: any) => 
              ['registration_open', 'draft', 'registration_closed'].includes(tournament.status)
            )
            .sort((a: any, b: any) => new Date(a.tournament_date).getTime() - new Date(b.tournament_date).getTime())
          
          // If we have less than 3 upcoming tournaments, fill with recently completed ones
          if (upcoming.length < 3) {
            const completed = data.tournaments
              .filter((tournament: any) => 
                ['completed', 'in_progress'].includes(tournament.status)
              )
              .sort((a: any, b: any) => new Date(b.tournament_date).getTime() - new Date(a.tournament_date).getTime())
              .slice(0, 3 - upcoming.length)
            
            setUpcomingTournaments([...upcoming, ...completed])
          } else {
            setUpcomingTournaments(upcoming.slice(0, 3))
          }
        }
      } catch (error) {
        console.error('Error fetching upcoming tournaments:', error)
      } finally {
        setTournamentsLoading(false)
      }
    }

    fetchUpcomingTournaments()

    // Set up real-time subscriptions for tournament slots
    const tournamentSlotsChannel = supabase
      .channel('tournament-slots-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_slots'
        },
        (payload: any) => {
          console.log('Tournament slots updated:', payload)
          // Refetch tournaments when slots change
          fetchUpcomingTournaments()
        }
      )
      .subscribe()

    // Set up real-time subscriptions for tournament status changes
    const tournamentStatusChannel = supabase
      .channel('tournament-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments'
        },
        (payload: any) => {
          console.log('Tournament status updated:', payload)
          // Refetch tournaments when status changes
          fetchUpcomingTournaments()
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(tournamentSlotsChannel)
      supabase.removeChannel(tournamentStatusChannel)
    }
  }, [])

  // Check for player profile when user is logged in
  useEffect(() => {
    const checkPlayerProfile = async () => {
      if (user && !isLoading && !hasCheckedProfile) {
        try {
          console.log('Sending user data for profile check:', user)
          console.log('Authorization header:', JSON.stringify(user))
          
          const response = await fetch('/api/player-profile', {
            method: 'GET',
            headers: {
              'Authorization': JSON.stringify(user)
            }
          })
          
          console.log('Player profile check - Response status:', response.status)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Player profile check - Full response data:', JSON.stringify(data, null, 2))
            console.log('Player profile check - data.success:', data.success)
            console.log('Player profile check - data.profile:', data.profile)
            console.log('Player profile check - data.profile exists:', !!data.profile)
            console.log('Player profile check - data.profile.id:', data.profile?.id)
            console.log('Player profile check - data.profile.id exists:', !!data.profile?.id)
            
            // Check if profile actually exists (not null)
            const hasValidProfile = data.success && data.profile !== null && data.profile && data.profile.id
            console.log('Player profile check - hasValidProfile:', hasValidProfile)
            console.log('Player profile check - profile is null:', data.profile === null)
            
            // Show prompt if user doesn't have a player profile
            if (!hasValidProfile) {
              console.log('No valid player profile found, showing prompt')
              setShowPlayerProfilePrompt(true)
            } else {
              console.log('Valid player profile found, NOT showing prompt')
            }
            setHasCheckedProfile(true)
          } else {
            console.log('API failed, showing prompt')
            // If API fails, assume no profile and show prompt
            setShowPlayerProfilePrompt(true)
            setHasCheckedProfile(true)
          }
        } catch (error) {
          console.error('Error checking player profile:', error)
          // On error, show prompt to be safe
          setShowPlayerProfilePrompt(true)
          setHasCheckedProfile(true)
        }
      }
    }

    checkPlayerProfile()
  }, [user, isLoading, hasCheckedProfile])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#19171b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
          <p className="text-[#DBD0C0]">Loading...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#19171b] w-full">
      {/* Player Profile Prompt */}
      {showPlayerProfilePrompt && (
        <PlayerProfilePrompt onClose={() => setShowPlayerProfilePrompt(false)} />
      )}
      
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-[rgba(206,161,122,0.15)] to-[rgba(219,208,192,0.15)] py-2 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/5 overflow-hidden">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(206,161,122,0.05)] to-[rgba(219,208,192,0.05)]"></div>
        <div className="relative w-full px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center">
            {user ? (
              <p className="text-[#DBD0C0] font-semibold text-base">
                <span className="block sm:inline">Welcome back, {user.firstname || user.email?.split('@')[0] || 'User'}!</span>
                <span className="block sm:inline sm:ml-2 text-[#CEA17A]">Ready to elevate your cricket journey?</span>
              </p>
            ) : (
              <p className="text-[#DBD0C0] font-semibold text-base">
                <span className="block sm:inline">Ready to elevate your cricket journey?</span>
                <Link href="/signin" className="block sm:inline sm:ml-2 text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-150">Sign in to get started!</Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Sharp Diagonal Split Background */}
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
          <div className="absolute top-1/4 left-1/2 w-32 h-32 bg-[#75020f]/5 rounded-full blur-xl animate-pulse-glow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#CEA17A]/5 rounded-full blur-lg animate-pulse-glow" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-[#DBD0C0]/3 rounded-full blur-md animate-pulse-glow" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 left-1/4 w-20 h-20 bg-[#51080d]/4 rounded-full blur-lg animate-pulse-glow" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-1/3 left-1/2 w-28 h-28 bg-[#2b0307]/3 rounded-full blur-xl animate-pulse-glow" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        {/* Sharp Geometric Elements - Behind Content */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Sharp Triangles */}
          <div className="absolute top-16 right-16 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-[#75020f]/10 rotate-45 animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-[#CEA17A]/8 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 left-1/3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-[#51080d]/6 animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Sharp Rectangles */}
          <div className="absolute top-1/4 right-1/4 w-4 h-8 bg-[#CEA17A]/8 rotate-45 animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-6 h-3 bg-[#75020f]/6 rotate-12 animate-pulse" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/2 left-1/6 w-3 h-6 bg-[#2b0307]/7 rotate-75 animate-pulse" style={{animationDelay: '0.5s'}}></div>
          
          {/* Sharp Lines */}
          <div className="absolute top-1/4 left-1/6 w-16 h-px bg-gradient-to-r from-[#CEA17A]/20 to-transparent rotate-45 animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/6 w-12 h-px bg-gradient-to-l from-[#75020f]/15 to-transparent rotate-12 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 right-1/4 w-8 h-px bg-gradient-to-r from-[#51080d]/18 to-transparent rotate-75 animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Sharp Hexagons */}
          <div className="absolute top-1/6 right-1/3 w-6 h-6 bg-[#CEA17A]/6 transform rotate-45 animate-pulse" style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}></div>
          <div className="absolute bottom-1/6 left-1/3 w-4 h-4 bg-[#75020f]/8 transform rotate-12 animate-pulse" style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', animationDelay: '1.5s'}}></div>
          
          {/* Sharp Diamonds */}
          <div className="absolute top-2/3 left-1/4 w-5 h-5 bg-[#2b0307]/7 rotate-45 animate-pulse" style={{animationDelay: '0.8s'}}></div>
          <div className="absolute bottom-1/5 right-1/5 w-3 h-3 bg-[#CEA17A]/9 rotate-45 animate-pulse" style={{animationDelay: '2.2s'}}></div>
        </div>
        
        {/* Animated Lines */}
        <div className="absolute top-1/2 left-0 w-1/3 h-px bg-gradient-to-r from-[#CEA17A] to-transparent animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-1/3 h-px bg-gradient-to-l from-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/4 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#75020f] to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-1/2 h-px bg-gradient-to-l from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
        
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Side - Content */}
            <div className="text-left relative z-20">
              <div className="animate-fade-in-up">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tight">
                  <span className="text-[#DBD0C0]">ELEVATE YOUR</span>
                  <br />
                  <span className="text-[#CEA17A]">CRICKET JOURNEY</span>
                  <br />
                  <span className="text-[#DBD0C0]">WITH US</span>
            </h1>
                <p className="text-xl text-[#DBD0C0] mb-8 leading-relaxed max-w-2xl text-justify">
                  Join <span className="text-[#CEA17A] font-bold animate-text-glow">Phoenix Force</span>, where passionate cricket enthusiasts come together to create unforgettable experiences. 
                  From competitive tournaments to skill development, we provide the ultimate platform for players, hosts, and fans alike.
                </p>
                {!user && (
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Link href="/signin" className="px-6 py-3 bg-[#CEA17A]/20 hover:bg-[#CEA17A]/30 text-[#CEA17A] font-bold rounded-lg transition-all duration-150 hover:scale-105 shadow-lg backdrop-blur-sm border border-[#CEA17A]/30 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10">Sign In</span>
                    </Link>
                    <Link href="/signin?returnUrl=/signin" className="px-6 py-3 border-2 border-[#CEA17A]/50 hover:border-[#CEA17A]/70 text-[#CEA17A] hover:text-[#CEA17A] font-bold rounded-lg transition-all duration-150 backdrop-blur-sm text-center">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Side - Upcoming Tournaments */}
            <div className="relative animate-fade-in-up delay-300 z-20">
              <div className="bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-2xl p-8 shadow-2xl border border-[#CEA17A]/20 animate-card-glow animate-border-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#DBD0C0]">Featured Tournaments</h3>
                        <Link
                href="/tournaments"
                className="text-[#DBD0C0] hover:text-[#CEA17A] text-sm font-medium transition-colors duration-150"
              >
                View All →
              </Link>
            </div>
                
                <div className="space-y-4 h-[400px] overflow-y-auto">
                  {tournamentsLoading ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="bg-[#303D49]/50 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-[#5D020A]/20 rounded mb-2"></div>
                        <div className="h-3 bg-[#5D020A]/10 rounded w-2/3"></div>
                      </div>
                    ))
                  ) : upcomingTournaments.length > 0 ? (
                    upcomingTournaments.map((tournament) => (
                      <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="block bg-[#19171b]/50 rounded-lg p-4 hover:bg-[#19171b]/70 transition-all duration-150 border border-[#CEA17A]/10 hover:animate-border-glow cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[#DBD0C0] font-semibold text-sm leading-tight">{tournament.name}</h4>
                          <span className={`w-32 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border text-center ${
                            tournament.status === 'registration_open' 
                              ? 'bg-green-500/15 text-green-300 border-green-500/25 shadow-lg shadow-green-500/10'
                              : tournament.status === 'completed'
                              ? 'bg-red-500/15 text-red-300 border-red-500/25 shadow-lg shadow-red-500/10'
                              : tournament.status === 'in_progress'
                              ? 'bg-red-500/15 text-red-300 border-red-500/25 shadow-lg shadow-red-500/10'
                              : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25 shadow-lg shadow-yellow-500/10'
                          }`}>
                            {tournament.status === 'registration_open' ? 'Open' : 
                             tournament.status === 'completed' ? 'Closed' :
                             tournament.status === 'in_progress' ? 'Closed' : 'Opening Soon'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-xs text-[#DBD0C0]">
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-2 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        {new Date(tournament.tournament_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                          </div>
                          
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-2 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {tournament.venue || 'TBD'}
                          </div>
                          
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-2 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{tournament.filled_slots || 0}/{tournament.total_slots || 0} players</span>
                          </div>
                        </div>
                        
                        {/* Waitlist info */}
                        {(tournament.waitlist_count || 0) > 0 && (
                          <div className="flex items-center mt-2">
                            <svg className="w-3 h-3 mr-2 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[#DBD0C0] text-xs">{tournament.waitlist_count} waitlisted players</span>
                          </div>
                        )}
                        
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-[#DBD0C0] mb-1">
                            <span>Slots filled</span>
                            <span>{Math.round(((tournament.filled_slots || 0) / (tournament.total_slots || 1)) * 100)}%</span>
                          </div>
                          <div className="w-full bg-[#19171b] rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-[#CEA17A] to-[#3E4E5A] h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${((tournament.filled_slots || 0) / (tournament.total_slots || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Waitlist progress bar */}
                        {(tournament.waitlist_count || 0) > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-[#DBD0C0] mb-1">
                              <span>Waitlist</span>
                              <span>{tournament.waitlist_count} players</span>
                            </div>
                            <div className="w-full bg-[#19171b] rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-[#CEA17A] to-[#DBD0C0] h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(((tournament.waitlist_count || 0) / 10) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        </Link>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <p className="text-gray-300 text-sm">No upcoming tournaments at the moment</p>
                      <p className="text-gray-400 text-xs mt-1">Check back soon for new events!</p>
                    </div>
                  )}
                    </div>
                
                {!tournamentsLoading && (
                  <div className="mt-6 pt-4 border-t border-[#CEA17A]/20">
                  <Link 
                    href="/tournaments"
                    className="w-full bg-[#19171b] hover:bg-[#2b0307] text-[#DBD0C0] font-medium py-3 px-4 rounded-lg transition-all duration-150 hover:scale-105 flex items-center justify-center"
                  >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      View All Tournaments
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
            
        </div>
      </div>

      {/* Explore Our Features Section */}
      <div className="bg-[#19171b] py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Discover powerful tools designed to streamline tournament management, enhance player development, and foster a thriving cricket community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Player Management */}
              <Link
                href="/players"
              className="group bg-gradient-to-br from-[#2b0307] to-[#51080d] rounded-2xl p-8 hover:from-[#51080d] hover:to-[#75020f] transition-all duration-150 hover:scale-105 hover:shadow-2xl hover:shadow-[#75020f]/20 animate-fade-in-up delay-100 flex flex-col h-full"
              >
              <div className="w-16 h-16 bg-[#75020f] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#51080d] group-hover:scale-110 transition-all duration-150">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
              <h3 className="text-xl font-bold text-white mb-4">Player Management</h3>
              <p className="text-white mb-6 leading-relaxed flex-grow">
                Create comprehensive player profiles with detailed statistics, skill assessments, and performance tracking to build championship-winning teams.
              </p>
              <div className="text-white font-medium group-hover:text-[#CEA17A] transition-colors duration-150 mt-auto">
                View Players →
                </div>
              </Link>

            {/* Tournament Hosting */}
              <Link
                href="/tournaments"
              className="group bg-gradient-to-br from-[#062456] to-[#132343] rounded-2xl p-8 hover:from-[#132343] hover:to-[#8E8895] transition-all duration-150 hover:scale-105 hover:shadow-2xl hover:shadow-[#8E8895]/20 animate-fade-in-up delay-150 flex flex-col h-full"
              >
              <div className="w-16 h-16 bg-[#8E8895] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#062456] group-hover:scale-110 transition-all duration-150">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
              <h3 className="text-xl font-bold text-white mb-4">Tournament Hosting</h3>
              <p className="text-white mb-6 leading-relaxed flex-grow">
                Organize professional tournaments with intelligent slot management, automated waitlist processing, and seamless payment integration for hosts.
              </p>
              <div className="text-white font-medium group-hover:text-[#CEA17A] transition-colors duration-150 mt-auto">
                    View Tournaments →
                </div>
              </Link>

            {/* Live Auction System */}
              <Link
                href="/auctions"
              className="group bg-gradient-to-br from-[#08333C] to-[#108E99] rounded-2xl p-8 hover:from-[#108E99] hover:to-[#C9CAB6] transition-all duration-150 hover:scale-105 hover:shadow-2xl hover:shadow-[#108E99]/20 animate-fade-in-up delay-200 flex flex-col h-full"
              >
              <div className="w-16 h-16 bg-[#108E99] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#08333C] group-hover:scale-110 transition-all duration-150">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
              <h3 className="text-xl font-bold text-white mb-4">Live Auction System</h3>
              <p className="text-white mb-6 leading-relaxed flex-grow">
                Experience dynamic player auctions with real-time bidding technology. Become a certified host to conduct transparent and engaging auction events.
              </p>
              <div className="text-white !text-white font-medium group-hover:text-[#CEA17A] transition-colors duration-150 mt-auto">
                    View Auctions →
              </div>
            </Link>

            {/* Community Network */}
            <Link
              href="/analytics"
              className="group bg-gradient-to-br from-[#303D49] to-[#1A1E22] rounded-2xl p-8 hover:from-[#1A1E22] hover:to-[#50020A] transition-all duration-150 hover:scale-105 hover:shadow-2xl hover:shadow-[#50020A]/20 animate-fade-in-up delay-250 flex flex-col h-full"
            >
              <div className="w-16 h-16 bg-[#50020A] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#303D49] group-hover:scale-110 transition-all duration-150">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Community Network</h3>
              <p className="text-white mb-6 leading-relaxed flex-grow">
                Connect with fellow cricket enthusiasts through our upcoming community features. Share memorable moments, form interest groups, and build lasting friendships.
              </p>
              <div className="text-white font-medium group-hover:text-[#CEA17A] transition-colors duration-150 mt-auto">
                Coming Soon →
              </div>
            </Link>
          </div>
                  </div>
                </div>


      {/* Stats Section */}
      <div className="bg-gradient-to-r from-[#09171F] to-[#3E4E5A] py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-[#CEA17A] mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-600 h-12 w-20 mx-auto rounded"></div>
                ) : (
                  `${stats.playersRegistered.toLocaleString()}`
                )}
              </div>
              <div className="text-sm font-medium text-[#CEA17A] uppercase tracking-wider">Community Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-[#CEA17A] mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-600 h-12 w-16 mx-auto rounded"></div>
                ) : (
                  `${stats.totalTournaments.toLocaleString()}`
                )}
              </div>
              <div className="text-sm font-medium text-[#CEA17A] uppercase tracking-wider">Tournaments Hosted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-[#CEA17A] mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-600 h-12 w-20 mx-auto rounded"></div>
                ) : (
                  `${stats.totalUsers.toLocaleString()}`
                )}
              </div>
              <div className="text-sm font-medium text-[#CEA17A] uppercase tracking-wider">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-[#CEA17A] mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-600 h-12 w-16 mx-auto rounded"></div>
                ) : (
                  `${stats.activeTournaments}`
                )}
              </div>
              <div className="text-sm font-medium text-[#CEA17A] uppercase tracking-wider">Active Events</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#19171b] py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-[#CEA17A] mb-4">Phoenix Force</h3>
              <p className="text-gray-200 mb-6 max-w-md">
                Empowering cricket enthusiasts through innovative technology and community-driven experiences. Join our platform to organize tournaments, develop players, and build championship-winning teams in a competitive yet supportive environment.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-200">
                <li><Link href="/tournaments" className="hover:text-[#CEA17A] transition-colors">Tournament Management</Link></li>
                <li><Link href="/players" className="hover:text-[#CEA17A] transition-colors">Player Development</Link></li>
                <li><Link href="/auctions" className="hover:text-[#CEA17A] transition-colors">Auction System</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-200">
                <li><Link href="/contact" className="hover:text-[#CEA17A] transition-colors">Contact Support</Link></li>
                <li><Link href="/faqs" className="hover:text-[#CEA17A] transition-colors">Help Center</Link></li>
                <li><Link href="/about" className="hover:text-[#CEA17A] transition-colors">Our Story</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
