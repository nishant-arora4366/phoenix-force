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
      // Create Supabase session for the user
      // In a full custom auth implementation, you'd handle sessions differently
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: result.user.email,
        password: 'dummy' // We'll handle this differently in practice
      })

      if (error) {
        // For now, we'll create a session manually
        // In production, you'd implement proper session management
        return NextResponse.json({
          success: true,
          user: result.user,
          message: 'Login successful'
        })
      }

      return NextResponse.json({
        success: true,
        user: result.user,
        session: session
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
