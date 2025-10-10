import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader, DecodedToken } from './jwt'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  status: string
  username?: string
  firstname?: string
  lastname?: string
}

/**
 * Middleware to authenticate API requests
 * @param request - Next.js request object
 * @returns Authenticated user data or null
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return null
    }

    // Verify JWT token
    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    // Verify user still exists and is active in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, status, username, firstname, lastname')
      .eq('id', decoded.userId)
      .eq('status', 'approved')
      .single()

    if (error || !user) {
      console.error('User not found or inactive:', error)
      return null
    }

    // Check for role downgrade (security check)
    // Allow role upgrades (viewer → host → admin) but block downgrades
    const roleHierarchy = { 'viewer': 1, 'host': 2, 'admin': 3 }
    const tokenRoleLevel = roleHierarchy[decoded.role as keyof typeof roleHierarchy] || 0
    const dbRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
    
    if (dbRoleLevel < tokenRoleLevel) {
      // Role was downgraded - return user with updated role but mark as downgraded
      console.warn('User role was downgraded:', { 
        tokenRole: decoded.role, 
        dbRole: user.role,
        userId: user.id
      })
      
      // Return user with current database role (not token role)
      return {
        id: user.id,
        email: user.email,
        role: user.role, // Use database role, not token role
        status: user.status,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname
      }
    }
    
    // If role was upgraded, update the token data but allow the request
    if (dbRoleLevel > tokenRoleLevel) {
      console.info('User role was upgraded, allowing request:', { 
        tokenRole: decoded.role, 
        dbRole: user.role,
        userId: user.id
      })
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Middleware to check if user has required role
 * @param user - Authenticated user
 * @param requiredRoles - Array of allowed roles
 * @returns true if user has required role
 */
export function hasRole(user: AuthenticatedUser | null, requiredRoles: string[]): boolean {
  if (!user) return false
  return requiredRoles.includes(user.role)
}

/**
 * Middleware to check if user is admin
 * @param user - Authenticated user
 * @returns true if user is admin
 */
export function isAdmin(user: AuthenticatedUser | null): boolean {
  return hasRole(user, ['admin'])
}

/**
 * Middleware to check if user is host or admin
 * @param user - Authenticated user
 * @returns true if user is host or admin
 */
export function isHostOrAdmin(user: AuthenticatedUser | null): boolean {
  return hasRole(user, ['host', 'admin'])
}

/**
 * Create authentication error response
 * @param message - Error message
 * @param status - HTTP status code
 * @returns NextResponse with error
 */
export function createAuthErrorResponse(message: string, status: number = 401): NextResponse {
  return NextResponse.json({
    success: false,
    error: message
  }, { status })
}

/**
 * Create authorization error response (for insufficient permissions)
 * @param message - Error message
 * @returns NextResponse with 403 error
 */
export function createAuthzErrorResponse(message: string = 'Insufficient permissions'): NextResponse {
  return NextResponse.json({
    success: false,
    error: message
  }, { status: 403 })
}

/**
 * Wrapper for API routes that require authentication
 * @param handler - API route handler function
 * @param requiredRoles - Optional array of required roles
 * @returns Wrapped handler with authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
  requiredRoles?: string[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Authenticate user
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createAuthErrorResponse('Authentication required')
    }

    // Check role requirements
    if (requiredRoles && !hasRole(user, requiredRoles)) {
      return createAuthzErrorResponse(`Access denied. Required roles: ${requiredRoles.join(', ')}`)
    }

    // Call the original handler with authenticated user
    return handler(request, user)
  }
}
