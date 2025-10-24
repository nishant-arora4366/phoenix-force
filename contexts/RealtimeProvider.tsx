'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { realtimeManager } from '@/lib/realtime-manager'
import { useAuctionRealtime, useTournamentRealtime, useUserNotifications, useAnalyticsRealtime } from '@/lib/realtime-utils-optimized'
import { secureSessionManager } from '@/src/lib/secure-session'
import { DB_TABLES } from '@/lib/constants'

interface RealtimeContextType {
  isConnected: boolean
  subscriptions: Set<string>
  stats: any
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

interface RealtimeProviderProps {
  children: ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<any>({})

  // Monitor realtime manager stats
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = realtimeManager.getStats()
      setStats(currentStats)
      setSubscriptions(new Set(currentStats.channels))
      setIsConnected(currentStats.activeChannels > 0)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realtimeManager.unsubscribeAll()
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ isConnected, subscriptions, stats }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Export all the specialized hooks for convenience
export {
  useAuctionRealtime,
  useTournamentRealtime,
  useUserNotifications,
  useAnalyticsRealtime
}
