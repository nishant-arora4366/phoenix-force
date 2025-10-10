import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getRecentActivity(request: NextRequest, user: AuthenticatedUser) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    // Get recent API activity with user information
    const { data, error } = await supabase
      .from('api_usage_analytics')
      .select(`
        route,
        method,
        response_status,
        response_time_ms,
        created_at,
        user_id,
        user_role
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      throw error
    }
    
    // Get user emails for the user IDs
    const userIds = Array.from(new Set(data?.map(item => item.user_id).filter(Boolean) || []))
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds)
    
    const userEmailMap = users?.reduce((acc, user) => {
      acc[user.id] = user.email
      return acc
    }, {} as Record<string, string>) || {}
    
    // Transform the data to match the expected format
    const recentActivity = data?.map(item => ({
      route: item.route,
      method: item.method,
      user_email: item.user_id ? userEmailMap[item.user_id] : undefined,
      user_role: item.user_role,
      response_status: item.response_status,
      response_time_ms: item.response_time_ms,
      created_at: item.created_at
    })) || []
    
    return NextResponse.json({
      success: true,
      data: recentActivity,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recent activity'
    }, { status: 500 })
  }
}

export const GET = withAuth(getRecentActivity, ['admin'])
