import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserStats(request: NextRequest, user: AuthenticatedUser) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    // Query API usage analytics directly
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('api_usage_analytics')
      .select(`
        user_id,
        endpoint,
        method,
        status_code,
        response_time_ms,
        created_at
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
    
    if (usageError) {
      logger.error('Failed to fetch usage data', usageError)
      throw usageError
    }
    
    // Group by user and calculate statistics
    const userStats = new Map<string, {
      user_id: string
      email?: string
      username?: string
      total_requests: number
      avg_response_time: number
      unique_endpoints: Set<string>
      success_rate: number
      last_active: string
    }>()
    
    // Process usage data
    for (const entry of usageData || []) {
      if (!entry.user_id) continue
      
      if (!userStats.has(entry.user_id)) {
        userStats.set(entry.user_id, {
          user_id: entry.user_id,
          total_requests: 0,
          avg_response_time: 0,
          unique_endpoints: new Set(),
          success_rate: 0,
          last_active: entry.created_at
        })
      }
      
      const stats = userStats.get(entry.user_id)!
      stats.total_requests++
      stats.avg_response_time = (stats.avg_response_time * (stats.total_requests - 1) + (entry.response_time_ms || 0)) / stats.total_requests
      stats.unique_endpoints.add(entry.endpoint)
      
      // Update last active
      if (new Date(entry.created_at) > new Date(stats.last_active)) {
        stats.last_active = entry.created_at
      }
    }
    
    // Get user details
    const userIds = Array.from(userStats.keys())
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, username, firstname, lastname')
        .in('id', userIds)
      
      if (!usersError && users) {
        for (const userRow of users) {
          const stats = userStats.get(userRow.id)
          if (stats) {
            stats.email = userRow.email
            stats.username = userRow.username || `${userRow.firstname} ${userRow.lastname}`.trim() || userRow.email
          }
        }
      }
    }
    
    // Convert to array and calculate success rate
    const result = Array.from(userStats.values()).map(stats => {
      // Calculate success rate (2xx and 3xx status codes)
      const successfulRequests = (usageData || [])
        .filter(e => e.user_id === stats.user_id && e.status_code >= 200 && e.status_code < 400)
        .length
      
      const successRate = stats.total_requests > 0 
        ? (successfulRequests / stats.total_requests) * 100 
        : 0
      
      return {
        user_id: stats.user_id,
        email: stats.email || 'Unknown',
        username: stats.username || 'Unknown',
        total_requests: stats.total_requests,
        avg_response_time: Math.round(stats.avg_response_time),
        unique_endpoints: stats.unique_endpoints.size,
        success_rate: Math.round(successRate * 100) / 100,
        last_active: stats.last_active
      }
    })
    
    // Sort by total requests (most active first)
    result.sort((a, b) => b.total_requests - a.total_requests)
    
    // Limit to top 10 users
    const topUsers = result.slice(0, 10)
    
    return NextResponse.json({
      success: true,
      data: topUsers,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      total_users: result.length
    })
  } catch (error: any) {
    logger.error('Failed to fetch user statistics', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch user activity statistics'
    }, { status: 500 })
  }
}

export const GET = withAuth(getUserStats, ['admin'])
