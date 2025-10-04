import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameters (passed from client-side session)
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No user ID provided'
      }, { status: 401 })
    }

    // Check if user is admin using service role (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    // Fetch all users using service role (bypasses RLS)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: users || []
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from query parameters (passed from client-side session)
    const url = new URL(request.url)
    const adminUserId = url.searchParams.get('userId')
    
    if (!adminUserId) {
      return NextResponse.json({
        success: false,
        error: 'No user ID provided'
      }, { status: 401 })
    }

    // Check if user is admin using service role (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', adminUserId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    const { userId: targetUserId, status, role } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    let updateData: any = {}
    if (status) updateData.status = status
    if (role) updateData.role = role

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No update data provided'
      }, { status: 400 })
    }

    // Update user using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', targetUserId)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
