import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/src/lib/jwt'
import { withAnalytics } from '@/src/lib/api-analytics'

async function logoutHandler(request: NextRequest) {
  try {
    // Get JWT token from authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, but that's okay for logout
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    // Optional: You could maintain a token blacklist in the database
    // for extra security (tokens that should be considered invalid before expiry)
    // For now, we'll just acknowledge the logout
    
    if (decoded?.userId) {
      // Log the logout event for analytics
      console.log(`User ${decoded.userId} logged out at ${new Date().toISOString()}`)
      
      // Optional: Clear any server-side session data or caches
      // This could include clearing Redis sessions, etc.
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error: any) {
    // Even if there's an error, we should still return success for logout
    // as the client will clear their local session anyway
    return NextResponse.json({
      success: true,
      message: 'Logged out'
    })
  }
}

export const POST = withAnalytics(logoutHandler)

// Also support GET for convenience
export const GET = withAnalytics(logoutHandler)
