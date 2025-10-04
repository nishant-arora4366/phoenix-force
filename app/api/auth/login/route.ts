import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
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

      // For custom authentication, we'll return the user data without Supabase session
      // The frontend will handle the session state
      return NextResponse.json({
        success: true,
        user: result.user,
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
