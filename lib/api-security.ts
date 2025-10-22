/**
 * API Security Middleware and Utilities
 * Ensures all APIs are properly secured with JWT authentication and role-based access
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/src/lib/jwt'
import { USER_ROLES, ERROR_MESSAGES } from './constants'
import { logger } from './logger'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
  }
}

/**
 * Rate limiting configuration
 */
const rateLimits = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // per minute

/**
 * Check rate limiting
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimits.get(identifier)

  if (!limit || now > limit.resetTime) {
    rateLimits.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  limit.count++
  return true
}

/**
 * Verify JWT token and extract user information
 */
export async function verifyAuth(request: NextRequest): Promise<{
  isValid: boolean
  user?: any
  error?: string
}> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.UNAUTHORIZED
      }
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.userId) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.SESSION_EXPIRED
      }
    }

    // Verify user exists and is active
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.UNAUTHORIZED
      }
    }

    if (user.status !== 'active' && user.status !== 'pending') {
      return {
        isValid: false,
        error: 'Account is suspended or inactive'
      }
    }

    return {
      isValid: true,
      user
    }
  } catch (error) {
    logger.error('Auth verification failed', error)
    return {
      isValid: false,
      error: ERROR_MESSAGES.UNAUTHORIZED
    }
  }
}

/**
 * Middleware for protecting API routes with authentication
 */
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles: string[] = []
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check rate limiting
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
      
      if (!checkRateLimit(clientIp)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }

      // Verify authentication
      const { isValid, user, error } = await verifyAuth(request)
      
      if (!isValid) {
        return NextResponse.json(
          { error: error || ERROR_MESSAGES.UNAUTHORIZED },
          { status: 401 }
        )
      }

      // Check role-based access
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        logger.warn(`Access denied for user ${user.id} with role ${user.role}`)
        return NextResponse.json(
          { error: ERROR_MESSAGES.UNAUTHORIZED },
          { status: 403 }
        )
      }

      // Add user to request
      (request as AuthenticatedRequest).user = user

      // Call the handler
      return await handler(request as AuthenticatedRequest)
    } catch (error) {
      logger.error('API security middleware error', error)
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERIC_ERROR },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware for admin-only routes
 */
export function withAdmin(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, [USER_ROLES.ADMIN])
}

/**
 * Middleware for host and admin routes
 */
export function withHostOrAdmin(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, [USER_ROLES.ADMIN, USER_ROLES.HOST])
}

/**
 * Validate and sanitize input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS
    return input
      .replace(/[<>"']/g, '')
      .trim()
      .slice(0, 1000) // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

/**
 * Validate request body against schema
 */
export function validateRequestBody(
  body: any,
  schema: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required?: boolean
    min?: number
    max?: number
    pattern?: RegExp
  }>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field]

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }

    if (value === undefined || value === null) {
      continue
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`)
      continue
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.min && value.length < rules.min) {
        errors.push(`${field} must be at least ${rules.min} characters`)
      }
      if (rules.max && value.length > rules.max) {
        errors.push(`${field} must be at most ${rules.max} characters`)
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} has invalid format`)
      }
    }

    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`)
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Log API access for analytics
 */
export async function logAPIAccess(
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number
) {
  try {
    await supabaseAdmin
      .from('api_usage_analytics')
      .insert({
        user_id: userId,
        endpoint,
        method,
        status_code: statusCode,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    logger.error('Failed to log API access', error)
  }
}

export default {
  withAuth,
  withAdmin,
  withHostOrAdmin,
  verifyAuth,
  sanitizeInput,
  validateRequestBody,
  logAPIAccess
}
