import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { AuthService } from '@/src/lib/auth'

// Input sanitization function
function sanitizeInput(input: string): string {
  if (!input) return ''
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const escapeMap: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return escapeMap[match]
  })
}

// Name validation function
function validateName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 50) return false
  return /^[a-zA-Z0-9\s\-']+$/.test(name)
}

async function postHandler(request: NextRequest) {
  try {
    const { email, password, username, firstname, lastname, middlename } = await request.json()

    // Normalize email to lowercase
    const normalizedEmail = email ? email.toLowerCase().trim() : ''

    // Validate required fields
    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format and length
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (normalizedEmail.length > 254) {
      return NextResponse.json(
        { success: false, error: 'Email address is too long (maximum 254 characters)' },
        { status: 400 }
      )
    }
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength and length
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: 'Password must be 6-128 characters long' },
        { status: 400 }
      )
    }

    // Validate and sanitize names
    if (firstname && !validateName(firstname)) {
      return NextResponse.json(
        { success: false, error: 'First name must be 1-50 characters and contain only letters, numbers, spaces, hyphens, and apostrophes' },
        { status: 400 }
      )
    }

    if (lastname && !validateName(lastname)) {
      return NextResponse.json(
        { success: false, error: 'Last name must be 1-50 characters and contain only letters, numbers, spaces, hyphens, and apostrophes' },
        { status: 400 }
      )
    }

    if (middlename && !validateName(middlename)) {
      return NextResponse.json(
        { success: false, error: 'Middle name must be 1-50 characters and contain only letters, numbers, spaces, hyphens, and apostrophes' },
        { status: 400 }
      )
    }

    // Register user with sanitized data
    const result = await AuthService.register({
      email: normalizedEmail,
      password,
      username: username ? sanitizeInput(username) : undefined,
      firstname: firstname ? sanitizeInput(firstname) : undefined,
      lastname: lastname ? sanitizeInput(lastname) : undefined,
      middlename: middlename ? sanitizeInput(middlename) : undefined
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the handler with analytics
export const POST = withAnalytics(postHandler)
