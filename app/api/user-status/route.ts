import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'No authenticated user',
        user: null
      })
    }

    // Check if user exists in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: userError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User status retrieved',
      auth_user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      public_user: userData,
      is_synced: !!userData,
      needs_sync: !userData
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
