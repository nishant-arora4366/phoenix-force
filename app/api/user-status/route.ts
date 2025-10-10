import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // User is already authenticated via withAuth middleware
    if (!user || !user.id) {
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
        email: user.email
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

// Export the handlers with analytics
export const GET = withAnalytics(withAuth(getHandler, ['viewer', 'host', 'admin']))
