-- Migration: Add synchronized auction timer fields
-- These fields enable a globally synchronized countdown timer per auction.
-- timer_last_reset_at: timestamp of last reset/resume (authoritative start point)
-- timer_paused: whether timer is currently paused
-- timer_paused_remaining_seconds: remaining seconds when paused (null while running)
-- All resets set timer_last_reset_at = now(), timer_paused = false, timer_paused_remaining_seconds = null

ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS timer_last_reset_at timestamptz,
  ADD COLUMN IF NOT EXISTS timer_paused boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS timer_paused_remaining_seconds integer;

-- Helpful index for queries (optional, lightweight)
CREATE INDEX IF NOT EXISTS idx_auctions_timer_active ON public.auctions (status, timer_paused) WHERE status = 'live' AND timer_paused = false;
