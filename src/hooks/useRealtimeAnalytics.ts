import { useState, useEffect, useRef } from 'react'
import { realtimeAnalyticsManager, RealtimeAnalyticsData } from '@/src/lib/realtime-analytics'

export interface UseRealtimeAnalyticsResult {
  data: RealtimeAnalyticsData | null
  isLoading: boolean
  error: string | null
  isConnected: boolean
}

export function useRealtimeAnalytics(): UseRealtimeAnalyticsResult {
  const [data, setData] = useState<RealtimeAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const subscriberIdRef = useRef<string>('')

  useEffect(() => {
    // Generate unique subscriber ID
    subscriberIdRef.current = `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const handleDataUpdate = (newData: RealtimeAnalyticsData) => {
      setData(newData)
      setIsLoading(false)
      setError(null)
      setIsConnected(true)
    }

    // Subscribe to real-time updates
    realtimeAnalyticsManager.subscribe(subscriberIdRef.current, handleDataUpdate)

    // Check if we have initial data
    const initialData = realtimeAnalyticsManager.getCurrentData()
    if (initialData) {
      setData(initialData)
      setIsLoading(false)
      setIsConnected(true)
    }

    // Cleanup on unmount
    return () => {
      if (subscriberIdRef.current) {
        realtimeAnalyticsManager.unsubscribe(subscriberIdRef.current)
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    isConnected
  }
}
