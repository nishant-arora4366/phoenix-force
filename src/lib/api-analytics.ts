import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken, extractTokenFromHeader } from './jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface APIUsageData {
  route: string
  method: string
  userId?: string
  userRole?: string
  ipAddress?: string
  userAgent?: string
  responseStatus: number
  responseTimeMs: number
  requestSizeBytes?: number
  responseSizeBytes?: number
}

/**
 * Track API usage analytics
 * @param data - API usage data to track
 */
export async function trackAPIUsage(data: APIUsageData): Promise<void> {
  try {
    // Don't track analytics for analytics endpoints to avoid infinite loops
    if (data.route.includes('/api/analytics')) {
      return
    }

    // Don't track if response time is too high (likely an error)
    if (data.responseTimeMs > 30000) {
      return
    }

    await supabase
      .from('api_usage_analytics')
      .insert({
        route: data.route,
        method: data.method,
        user_id: data.userId || null,
        user_role: data.userRole || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        response_status: data.responseStatus,
        response_time_ms: data.responseTimeMs,
        request_size_bytes: data.requestSizeBytes || null,
        response_size_bytes: data.responseSizeBytes || null
      })
  } catch (error) {
    // Silently fail analytics tracking to not affect main functionality
    console.error('Failed to track API usage:', error)
  }
}

/**
 * Extract user information from request
 * @param request - NextRequest object
 * @returns User information or null
 */
export async function extractUserInfo(request: NextRequest): Promise<{ userId?: string; userRole?: string } | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    // Get fresh user data from database
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', decoded.userId)
      .single()

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      userRole: user.role
    }
  } catch (error) {
    return null
  }
}

/**
 * Get client IP address from request
 * @param request - NextRequest object
 * @returns IP address or null
 */
export function getClientIP(request: NextRequest): string | null {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return null
}

/**
 * Calculate request size in bytes
 * @param request - NextRequest object
 * @returns Request size in bytes
 */
export async function getRequestSize(request: NextRequest): Promise<number> {
  try {
    // Get headers size
    let headersSize = 0
    request.headers.forEach((value, key) => {
      headersSize += key.length + value.length + 4 // +4 for ": " and "\r\n"
    })
    
    // Get body size if it exists
    let bodySize = 0
    if (request.body) {
      const body = await request.text()
      bodySize = new Blob([body]).size
    }
    
    return headersSize + bodySize
  } catch (error) {
    return 0
  }
}

/**
 * Calculate response size in bytes
 * @param response - NextResponse object
 * @returns Response size in bytes
 */
export function getResponseSize(response: NextResponse): number {
  try {
    // Get headers size
    let headersSize = 0
    response.headers.forEach((value, key) => {
      headersSize += key.length + value.length + 4 // +4 for ": " and "\r\n"
    })
    
    // Get body size if it exists
    let bodySize = 0
    if (response.body) {
      // This is an approximation since we can't easily get the actual body size
      // In a real implementation, you might want to intercept the response body
      bodySize = 0
    }
    
    return headersSize + bodySize
  } catch (error) {
    return 0
  }
}

/**
 * Wrapper for API routes that adds analytics tracking
 * @param handler - API route handler function
 * @returns Wrapped handler with analytics
 */
export function withAnalytics(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const route = request.nextUrl.pathname
    const method = request.method
    
    try {
      // Extract user info
      const userInfo = await extractUserInfo(request)
      
      // Get request size
      const requestSize = await getRequestSize(request)
      
      // Call the original handler
      const response = await handler(request)
      
      // Calculate response time
      const responseTime = Date.now() - startTime
      
      // Get response size
      const responseSize = getResponseSize(response)
      
      // Track analytics (don't await to avoid blocking response)
      trackAPIUsage({
        route,
        method,
        userId: userInfo?.userId,
        userRole: userInfo?.userRole,
        ipAddress: getClientIP(request) || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        responseStatus: response.status,
        responseTimeMs: responseTime,
        requestSizeBytes: requestSize,
        responseSizeBytes: responseSize
      }).catch(error => {
        console.error('Analytics tracking failed:', error)
      })
      
      return response
    } catch (error) {
      // Calculate response time even for errors
      const responseTime = Date.now() - startTime
      
      // Track error analytics
      trackAPIUsage({
        route,
        method,
        userId: (await extractUserInfo(request))?.userId,
        userRole: (await extractUserInfo(request))?.userRole,
        ipAddress: getClientIP(request) || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        responseStatus: 500,
        responseTimeMs: responseTime,
        requestSizeBytes: await getRequestSize(request),
        responseSizeBytes: 0
      }).catch(analyticsError => {
        console.error('Analytics tracking failed:', analyticsError)
      })
      
      throw error
    }
  }
}

/**
 * Get API usage statistics
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns API usage statistics
 */
export async function getAPIUsageStats(
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: Date = new Date()
) {
  try {
    const { data, error } = await supabase.rpc('get_api_usage_stats', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
    
    if (error) {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Failed to get API usage stats:', error)
    return []
  }
}

/**
 * Get user activity statistics
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns User activity statistics
 */
export async function getUserActivityStats(
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: Date = new Date()
) {
  try {
    const { data, error } = await supabase.rpc('get_user_activity_stats', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
    
    if (error) {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Failed to get user activity stats:', error)
    return []
  }
}

/**
 * Get hourly usage patterns
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Hourly usage patterns
 */
export async function getHourlyUsagePatterns(
  startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  endDate: Date = new Date()
) {
  try {
    const { data, error } = await supabase.rpc('get_hourly_usage_patterns', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
    
    if (error) {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Failed to get hourly usage patterns:', error)
    return []
  }
}
