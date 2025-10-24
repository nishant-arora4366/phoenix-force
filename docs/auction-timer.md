# Auction Timer (Synchronized)

This repository now includes a globally synchronized auction countdown timer.

## Overview

Each auction row holds authoritative timer state. All clients derive the countdown locally from these persisted fields so they remain in sync (only cosmetic drift < 0.5s due to polling interval).

### New Database Columns (table: `auctions`)

| Column | Type | Purpose |
| ------ | ---- | ------- |
| `timer_last_reset_at` | timestamptz | Server timestamp when the timer (re)started. Remaining time = `timer_seconds - (now - timer_last_reset_at)` while running. |
| `timer_paused` | boolean | Indicates whether the timer is paused. |
| `timer_paused_remaining_seconds` | integer | Snapshot of remaining time captured at the moment of pause. Null while running. |

### Life‑cycle

1. Auction starts (status -> `live`): if the timer has never started we set `timer_last_reset_at = now()`.
2. Any qualifying action (bid, undo bid, skip, undo skip, next, previous, sell, undo sell) resets the timer: `timer_last_reset_at = now()`, `timer_paused = false`, `timer_paused_remaining_seconds = null`.
3. Pause: calculate remaining seconds, store in `timer_paused_remaining_seconds`, set `timer_paused = true`.
4. Resume: compute a synthetic `timer_last_reset_at = now() - (duration - remaining)` and clear pause fields.

### Authoritative Actions Triggering Reset

| Action | Endpoint(s) touched |
| ------ | ------------------- |
| Place bid | `POST /api/auctions/:id/bids` |
| Undo bid | `DELETE /api/auctions/:id/bids?bidId=` |
| Skip | `POST /api/auctions/:id/skip` |
| Undo skip | `DELETE /api/auctions/:id/skip` |
| Next player | `POST /api/auctions/:id/current-player` (action `next`) |
| Previous player | same (action `previous`) |
| Set current player | same (action `set_current` / `set_first`) |
| Sell player | `PATCH /api/auctions?action=sell_player` |
| Undo sell (unsell) | `POST /api/auctions/:id/undo-player-assignment` |

### Pause / Resume Timer

New route: `POST /api/auctions/:id/timer` with JSON body `{ "action": "pause" }` or `{ "action": "resume" }`.

Authorization: host or admin only (matches existing auction control privileges).

### Client Logic (Hook)

`hooks/useAuctionTimer.ts` derives:

```ts
const {
  remainingSeconds,
  durationSeconds,
  isActive,
  isPaused,
  pause,      // calls pause endpoint
  resume,     // calls resume endpoint
  progressKey,// increments on reset/resume for CSS animation reset
  animationStartTime
} = useAuctionTimer(auction)
```

The hook subscribes indirectly through existing realtime updates on the `auctions` table, so no extra channels are opened.

### Styling / Animation

The progress bar CSS animation uses `progressKey` to restart smoothly and `animationStartTime` to offset animation when resuming.

### Edge Cases

* If a client joins mid-cycle, it receives the current auction row (including `timer_last_reset_at`) and computes accurate remaining time.
* If a pause occurs while a client is offline, on reconnect it displays the stored `timer_paused_remaining_seconds`.
* If the timer expires (remaining reaches 0) no automatic action is performed yet; future enhancement could auto-skip or auto-sell.

### Future Enhancements (Suggested)

* Auto action when timer hits zero (configurable: auto-skip or auto-sell highest bidder).
* Drift correction via occasional server time sync endpoint (current approach is usually sufficient for <1s drift).
* Optional per-auction configuration to disable automatic reset on certain actions.
* Visual warning (color flash / sound) for final N seconds.

---
Maintainer Notes: If adding RLS policies that restrict column updates, ensure the policies permit hosts/admins to update these new timer fields.
