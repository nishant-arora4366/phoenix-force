import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { user_id, role } = await request.json()
    
    if (!user_id || !role) {
      return NextResponse.json({
        success: false,
        error: 'User ID and role are required'
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Update user role
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: data[0]
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update user role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
