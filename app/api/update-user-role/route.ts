import { NextRequest, NextResponse } from 'next/server'
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function putHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, newRole } = body

    if (!userId || !newRole) {
      return NextResponse.json({
        success: false,
        error: 'User ID and new role are required'
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['viewer', 'host', 'captain', 'admin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be one of: viewer, host, captain, admin'
      }, { status: 400 })
    }

    // Update user role
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${newRole}`
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    // Find user by email
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, firstname, lastname, role, created_at, updated_at')
      .ilike('email', `%${email}%`)
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

