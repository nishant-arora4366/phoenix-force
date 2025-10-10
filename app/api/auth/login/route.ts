import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/src/lib/auth'
import { supabase } from '@/src/lib/supabaseClient'
import { generateToken } from '@/src/lib/jwt'
import { withAnalytics } from '@/src/lib/api-analytics'

async function loginHandler(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Login user
    const result = await AuthService.login(email, password)

    if (result.success && result.user) {
      // Check user status and provide appropriate messaging
      const userStatus = result.user.status
      let message = 'Login successful'
      
      if (userStatus === 'pending') {
        message = 'Login successful. Your account is pending admin approval. You have limited access until approved.'
      } else if (userStatus === 'rejected') {
        return NextResponse.json(
          { success: false, error: 'Your account has been rejected. Please contact admin.' },
          { status: 403 }
        )
      }

      // Generate JWT token for secure authentication
      const token = generateToken({
        id: result.user.id,
        email: result.user.email,
        role: result.user.role
      })

      // Return user data with JWT token
      return NextResponse.json({
        success: true,
        user: result.user,
        token: token,
        message: message
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withAnalytics(loginHandler)
