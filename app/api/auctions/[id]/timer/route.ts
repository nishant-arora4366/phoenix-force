import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/src/lib/auth-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!['admin', 'host'].includes(user.role)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

  const { id: auctionId } = await params
  const body = await request.json().catch(() => ({}))
  const action = body.action as 'pause' | 'resume' | 'reset'

  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select('id, status, timer_seconds, timer_last_reset_at, timer_paused, timer_paused_remaining_seconds')
    .eq('id', auctionId)
    .single()

  if (auctionError || !auction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
  }

  if (auction.status !== 'live') {
    return NextResponse.json({ error: 'Auction must be live to control timer' }, { status: 400 })
  }

  switch (action) {
    case 'pause': {
      if (auction.timer_paused) {
        return NextResponse.json({ success: true, message: 'Timer already paused' })
      }
      if (!auction.timer_last_reset_at) {
        return NextResponse.json({ error: 'Timer has not been started yet' }, { status: 400 })
      }
      const elapsed = (Date.now() - new Date(auction.timer_last_reset_at).getTime()) / 1000
      const remaining = Math.max(0, Math.floor((auction.timer_seconds || 0) - elapsed))
      const { error } = await supabase
        .from('auctions')
        .update({
          timer_paused: true,
          timer_paused_remaining_seconds: remaining
        })
        .eq('id', auctionId)
      if (error) return NextResponse.json({ error: 'Failed to pause timer' }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Timer paused', remaining })
    }
    case 'resume': {
      if (!auction.timer_paused) {
        return NextResponse.json({ success: true, message: 'Timer already running' })
      }
      const remaining = auction.timer_paused_remaining_seconds || 0
      const adjustedStart = new Date(Date.now() - ((auction.timer_seconds || 0) - remaining) * 1000).toISOString()
      const { error } = await supabase
        .from('auctions')
        .update({
          timer_paused: false,
          timer_paused_remaining_seconds: null,
          timer_last_reset_at: adjustedStart
        })
        .eq('id', auctionId)
      if (error) return NextResponse.json({ error: 'Failed to resume timer' }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Timer resumed' })
    }
    case 'reset': {
      const { error } = await supabase
        .from('auctions')
        .update({
          timer_last_reset_at: new Date().toISOString(),
          timer_paused: false,
          timer_paused_remaining_seconds: null
        })
        .eq('id', auctionId)
      if (error) return NextResponse.json({ error: 'Failed to reset timer' }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Timer reset' })
    }
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}
