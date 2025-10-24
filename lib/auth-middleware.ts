/**
 * Centralized JWT authentication middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { ERROR_MESSAGES } from './constants'
import { logger } from './logger'

const JWT_SECRET = process.env.JWT_SECRET!

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
    status: string
  }
}

export interface AuthResult {
  success: boolean
  user?: any
  error?: string
  status?: number
}

/**
 * Verify JWT token and extract user data
 */
export async function verifyToken(token: string): Promise<AuthResult> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return {
        success: false,
        error: ERROR_MESSAGES.SESSION_EXPIRED,
        status: 401
      }
    }
    
    return {
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        status: decoded.status
      }
    }
  } catch (error: any) {
    logger.error('Token verification failed', error)
    
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: ERROR_MESSAGES.SESSION_EXPIRED,
        status: 401
      }
    }
    
    return {
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED,
      status: 401
    }
  }
}

/**
 * Extract and verify JWT token from request headers
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
        status: 401
      }
    }
    
    // Extract token from Bearer format
    const token = authHeader.replace('Bearer ', '').trim()
    
    if (!token) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
        status: 401
      }
    }
    
    // Verify token
    return await verifyToken(token)
  } catch (error) {
    logger.error('Authentication failed', error)
    return {
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED,
      status: 401
    }
  }
}

/**
 * Require specific role for access
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthResult> {
  const authResult = await authenticateRequest(request)
  
  if (!authResult.success) {
    return authResult
  }
  
  if (!authResult.user || !allowedRoles.includes(authResult.user.role)) {
    return {
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED,
      status: 403
    }
  }
  
  return authResult
}

/**
 * Create a standardized unauthorized response
 */
export function unauthorizedResponse(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}

/**
 * Create a standardized forbidden response
 */
export function forbiddenResponse(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  )
}

/**
 * Middleware to check if user is authenticated and has required status
 */
export async function requireApprovedUser(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateRequest(request)
  
  if (!authResult.success) {
    return authResult
  }
  
  if (authResult.user?.status !== 'approved' && authResult.user?.status !== 'active') {
    return {
      success: false,
      error: 'User account is not approved',
      status: 403
    }
  }
  
  return authResult
}

/**
 * Get user from request (helper function)
 */
export async function getUserFromRequest(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  return authResult.success ? authResult.user : null
}

export default {
  verifyToken,
  authenticateRequest,
  requireRole,
  requireApprovedUser,
  getUserFromRequest,
  unauthorizedResponse,
  forbiddenResponse
}
