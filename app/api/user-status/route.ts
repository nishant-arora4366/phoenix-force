import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid authorization header'
      }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({
        success: false,
        message: 'No authenticated user',
        user: null
      })
    }

    // Check if user exists in public.users table
    const { data: publicUserData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
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
        id: userData.id,
        email: userData.email,
        created_at: userData.created_at
      },
      public_user: publicUserData,
      is_synced: !!publicUserData,
      needs_sync: !publicUserData
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
