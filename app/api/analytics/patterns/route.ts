import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware'
import { getHourlyUsagePatterns } from '@/src/lib/api-analytics'

async function getUsagePatterns(request: NextRequest, user: AuthenticatedUser) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    const patterns = await getHourlyUsagePatterns(start, end)
    
    return NextResponse.json({
      success: true,
      data: patterns,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching usage patterns:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch usage patterns'
    }, { status: 500 })
  }
}

export const GET = withAuth(getUsagePatterns, ['admin'])
