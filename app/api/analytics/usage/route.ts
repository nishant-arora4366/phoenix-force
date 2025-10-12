import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics';
import { getAPIUsageStats } from '@/src/lib/api-analytics'

async function getUsageStats(request: NextRequest, user: AuthenticatedUser) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    const stats = await getAPIUsageStats(start, end)
    
    return NextResponse.json({
      success: true,
      data: stats,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch usage statistics'
    }, { status: 500 })
  }
}

export const GET = withAuth(getUsageStats, ['admin'])
