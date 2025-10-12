import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/src/lib/auth-middleware'
import { generateToken } from '@/src/lib/jwt'

/**
 * POST /api/auth/refresh-token
 * Refresh the JWT token for an authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the current token (even if close to expiration)
    const user = await authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Generate a new token with fresh expiration
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    console.log(`[RefreshToken] Token refreshed for user: ${user.email}`)

    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        status: user.status
      }
    })
  } catch (error: any) {
    console.error('[RefreshToken] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to refresh token'
    }, { status: 500 })
  }
}
