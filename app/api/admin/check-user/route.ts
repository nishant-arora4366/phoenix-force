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

    // Get user role and status using service role (bypasses RLS)
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        status: userData.status
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
