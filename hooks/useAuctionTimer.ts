import { useEffect, useRef, useState, useCallback } from 'react'
import { secureSessionManager } from '@/src/lib/secure-session'

interface AuctionWithTimer {
  id: string
  status?: string
  timer_seconds?: number
  timer_last_reset_at?: string | null
  timer_paused?: boolean | null
  timer_paused_remaining_seconds?: number | null
}

interface UseAuctionTimerResult {
  remainingSeconds: number
  durationSeconds: number
  isActive: boolean
  isPaused: boolean
  isExpired: boolean
  pause: () => Promise<void>
  resume: () => Promise<void>
  reset: () => Promise<void>
  progressPercent: number
}

/**
 * useAuctionTimer
 * Derives a synchronized countdown timer from auction row state.
 * Server is authoritative via auctions table fields updated on each reset/pause/resume.
 */
export function useAuctionTimer(auction: AuctionWithTimer | null | undefined): UseAuctionTimerResult {
  const [now, setNow] = useState(() => Date.now())
  const lastResetRef = useRef<string | null | undefined>(undefined)
  const lastPausedRef = useRef<boolean | null | undefined>(undefined)

  const durationSeconds = auction?.timer_seconds || 0
  const isPaused = !!auction?.timer_paused
  // Treat timer as active for any live auction with a configured duration
  const isActive = !!(auction && auction.status === 'live' && durationSeconds > 0)

  // Heartbeat – update every 16ms (~60fps) for smooth animation
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => setNow(Date.now()), 16)
    return () => clearInterval(interval)
  }, [isActive])

  // Track state changes for reference
  useEffect(() => {
    lastResetRef.current = auction?.timer_last_reset_at
    lastPausedRef.current = auction?.timer_paused
  }, [auction?.timer_last_reset_at, auction?.timer_paused])

  let remainingSeconds = 0
  if (auction && durationSeconds > 0) {
    const baseStart = auction.timer_last_reset_at || (auction as any).started_at || null
    if (isPaused) {
      // If paused, the remaining time is fixed to the value stored in the DB.
      remainingSeconds = auction.timer_paused_remaining_seconds ?? durationSeconds
    } else {
      if (baseStart) {
        const elapsed = (now - new Date(baseStart).getTime()) / 1000
        remainingSeconds = Math.max(0, Math.floor(durationSeconds - elapsed))
      } else {
        // Fallback for legacy auctions before first reset.
        remainingSeconds = durationSeconds
      }
    }
  }
  const isExpired = remainingSeconds <= 0 && isActive && !isPaused

  // Calculate progress percentage (0-100) - always based on auction.timer_seconds as max
  const progressPercent = durationSeconds > 0 
    ? Math.max(0, Math.min(100, (remainingSeconds / durationSeconds) * 100))
    : 0

  const pause = useCallback(async () => {
    if (!auction?.id || isPaused) return
    try {
      const token = secureSessionManager.getToken()
      await fetch(`/api/auctions/${auction.id}/timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'pause' })
      })
    } catch {
      // Silently ignore; UI will remain unchanged if unauthorized
    }
  }, [auction?.id, isPaused])

  const resume = useCallback(async () => {
    if (!auction?.id || !isPaused) return
    try {
      const token = secureSessionManager.getToken()
      await fetch(`/api/auctions/${auction.id}/timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'resume' })
      })
    } catch {
      // Silent fail
    }
  }, [auction?.id, isPaused])

  const reset = useCallback(async () => {
    if (!auction?.id) return
    try {
      const token = secureSessionManager.getToken()
      await fetch(`/api/auctions/${auction.id}/timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'reset' })
      })
    } catch {
      // Silent fail
    }
  }, [auction?.id])

  return {
    remainingSeconds,
    durationSeconds,
    isActive,
    isPaused,
    isExpired,
    pause,
    resume,
    reset,
    progressPercent
  }
}
