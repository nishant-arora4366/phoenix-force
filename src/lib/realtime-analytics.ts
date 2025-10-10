import { createClient } from '@supabase/supabase-js'
import { secureSessionManager } from './secure-session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface RealtimeAnalyticsData {
  totalRequests: number
  uniqueUsers: number
  avgResponseTime: number
  successRate: number
  topEndpoints: Array<{
    route: string
    method: string
    total_requests: number
    unique_users: number
    avg_response_time_ms: number
    success_rate: number
  }>
  recentActivity: Array<{
    route: string
    method: string
    user_email?: string
    user_role?: string
    response_status: number
    response_time_ms: number
    created_at: string
  }>
}

class RealtimeAnalyticsManager {
  private static instance: RealtimeAnalyticsManager
  private subscribers: Map<string, (data: RealtimeAnalyticsData) => void> = new Map()
  private analyticsData: RealtimeAnalyticsData | null = null
  private isSubscribed = false
  private refreshInterval: NodeJS.Timeout | null = null

  static getInstance(): RealtimeAnalyticsManager {
    if (!RealtimeAnalyticsManager.instance) {
      RealtimeAnalyticsManager.instance = new RealtimeAnalyticsManager()
    }
    return RealtimeAnalyticsManager.instance
  }

  /**
   * Subscribe to real-time analytics updates
   * @param subscriberId - Unique identifier for the subscriber
   * @param callback - Callback function to receive updates
   */
  subscribe(subscriberId: string, callback: (data: RealtimeAnalyticsData) => void) {
    this.subscribers.set(subscriberId, callback)
    
    // If this is the first subscriber, start the real-time monitoring
    if (this.subscribers.size === 1) {
      this.startRealtimeMonitoring()
    }
    
    // Send current data immediately if available
    if (this.analyticsData) {
      callback(this.analyticsData)
    }
  }

  /**
   * Unsubscribe from real-time analytics updates
   * @param subscriberId - Unique identifier for the subscriber
   */
  unsubscribe(subscriberId: string) {
    this.subscribers.delete(subscriberId)
    
    // If no more subscribers, stop the real-time monitoring
    if (this.subscribers.size === 0) {
      this.stopRealtimeMonitoring()
    }
  }

  /**
   * Start real-time monitoring
   */
  private startRealtimeMonitoring() {
    if (this.isSubscribed) return
    
    this.isSubscribed = true
    
    // Initial data fetch
    this.fetchAnalyticsData()
    
    // Set up periodic refresh (every 30 seconds)
    this.refreshInterval = setInterval(() => {
      this.fetchAnalyticsData()
    }, 30000)
    
    // Subscribe to real-time changes in the analytics table
    const channel = supabase
      .channel('api_analytics_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'api_usage_analytics'
        },
        (payload) => {
          console.log('New API call detected:', payload)
          // Refresh data when new analytics entries are added
          this.fetchAnalyticsData()
        }
      )
      .subscribe((status) => {
        console.log('Analytics subscription status:', status)
      })
  }

  /**
   * Stop real-time monitoring
   */
  private stopRealtimeMonitoring() {
    if (!this.isSubscribed) return
    
    this.isSubscribed = false
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    
    // Unsubscribe from Supabase real-time
    supabase.removeAllChannels()
  }

  /**
   * Fetch current analytics data
   */
  private async fetchAnalyticsData() {
    try {
      const user = secureSessionManager.getUser()
      if (!user || user.role !== 'admin') {
        return
      }

      const token = secureSessionManager.getToken()
      if (!token) {
        return
      }

      // Calculate time range (last 24 hours for real-time view)
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Fetch analytics data in parallel
      const [usageResponse, usersResponse, recentResponse] = await Promise.all([
        fetch(`/api/analytics/usage?startDate=${startDateStr}&endDate=${endDateStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/users?startDate=${startDateStr}&endDate=${endDateStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/recent?startDate=${startDateStr}&endDate=${endDateStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const [usageData, usersData, recentData] = await Promise.all([
        usageResponse.json(),
        usersResponse.json(),
        recentResponse.json()
      ])

      if (usageData.success && usersData.success && recentData.success) {
        const analyticsData: RealtimeAnalyticsData = {
          totalRequests: usageData.data.reduce((sum: number, item: any) => sum + parseInt(item.total_requests), 0),
          uniqueUsers: usersData.data.length,
          avgResponseTime: usageData.data.length > 0 
            ? Math.round(usageData.data.reduce((sum: number, item: any) => sum + parseFloat(item.avg_response_time_ms || 0), 0) / usageData.data.length)
            : 0,
          successRate: usageData.data.length > 0 
            ? Math.round(usageData.data.reduce((sum: number, item: any) => sum + parseFloat(item.success_rate || 0), 0) / usageData.data.length)
            : 0,
          topEndpoints: usageData.data.slice(0, 5),
          recentActivity: recentData.data || []
        }

        this.analyticsData = analyticsData
        this.notifySubscribers(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching real-time analytics:', error)
    }
  }

  /**
   * Notify all subscribers of new data
   */
  private notifySubscribers(data: RealtimeAnalyticsData) {
    this.subscribers.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error notifying analytics subscriber:', error)
      }
    })
  }

  /**
   * Get current analytics data (if available)
   */
  getCurrentData(): RealtimeAnalyticsData | null {
    return this.analyticsData
  }
}

export const realtimeAnalyticsManager = RealtimeAnalyticsManager.getInstance()
