import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { AuthService } from '@/src/lib/auth'

async function postHandler(request: NextRequest) {
  try {
    const { email, password, username, firstname, lastname } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Register user
    const result = await AuthService.register({
      email,
      password,
      username,
      firstname,
      lastname
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Registration successful. Your account is pending admin approval.',
        user: result.user
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the handler with analytics
export const POST = withAnalytics(postHandler)
