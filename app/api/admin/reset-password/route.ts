import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function POSTHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // User is already authenticated via withAuth middleware
    const userId = user.id
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Check if user is admin using service role (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({ success: false, error: 'Access denied - Admin role required' }, { status: 403 })
    }

    const { userId: targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Get the target user's email
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', targetUserId)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 })
    }

    // Hash the email as the new password
    const newPassword = targetUser.email
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update the user's password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', targetUserId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Password reset successfully. New password is: ${newPassword}` 
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Export handlers with analytics

export const POST = withAnalytics(withAuth(POSTHandler, ['admin']))
