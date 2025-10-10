import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics';
import { createClient } from '@supabase/supabase-js'

async function postHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message
      }, { status: 500 })
    }

    // Get existing users to preserve their roles
    const { data: existingUsers, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id, role')

    if (existingError) {
      return NextResponse.json({
        success: false,
        error: existingError.message
      }, { status: 500 })
    }

    // Create a map of existing user roles
    const existingRoles = new Map(existingUsers?.map(user => [user.id, user.role]) || [])

    // Sync users to public.users table, preserving existing roles
    const usersToInsert = authUsers.users.map(user => ({
      id: user.id,
      email: user.email || '',
      role: existingRoles.get(user.id) || 'viewer' // Preserve existing role or default to 'viewer'
    }))

    const { data: insertedUsers, error: insertError } = await supabaseAdmin
      .from('users')
      .upsert(usersToInsert, { onConflict: 'id' })
      .select()

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Users synced successfully',
      synced_count: insertedUsers?.length || 0,
      users: insertedUsers
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to sync users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Export the handlers with analytics
export const POST = withAnalytics(withAuth(postHandler, ['viewer', 'host', 'admin']))
