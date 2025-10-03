import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
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

    // Sync users to public.users table
    const usersToInsert = authUsers.users.map(user => ({
      id: user.id,
      email: user.email || '',
      role: 'viewer' as const
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
