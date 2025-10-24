# Auction Timer Design Documentation

## Overview
The auction timer feature provides a synchronized countdown timer for live auctions, allowing hosts/admins to control the bidding pace.

## Database Design

### Current Implementation
Timer state is stored directly in the `auctions` table with three additional columns:

```sql
ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS timer_last_reset_at timestamptz,
  ADD COLUMN IF NOT EXISTS timer_paused boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS timer_paused_remaining_seconds integer;
```

### Design Rationale

**Why store timer state in the auctions table?**

1. **Tight Coupling**: Timer state is intrinsically tied to the auction lifecycle
   - Only exists when auction is live
   - No historical data needed
   - State resets with each player change

2. **Minimal Overhead**: Only 3 additional columns
   - `timer_last_reset_at` (8 bytes) - timestamp
   - `timer_paused` (1 byte) - boolean flag
   - `timer_paused_remaining_seconds` (4 bytes) - integer
   - Total: ~13 bytes per auction row

3. **Query Efficiency**: 
   - Timer data always fetched with auction data
   - No additional JOIN required
   - Single atomic update for timer operations

4. **Simplicity**:
   - No separate table to manage
   - No foreign key constraints
   - Easier to reason about data flow

### Alternative Considered: Separate Timer Table

A separate `auction_timers` table was considered but rejected:

```sql
-- NOT IMPLEMENTED
CREATE TABLE auction_timers (
  auction_id uuid PRIMARY KEY REFERENCES auctions(id),
  last_reset_at timestamptz,
  paused boolean DEFAULT false,
  paused_remaining_seconds integer
);
```

**Why this was rejected:**
- Adds complexity without significant benefit
- Requires JOIN on every auction query
- Timer state has no independent lifecycle
- No need for historical timer data
- Adds foreign key constraint overhead

### When to Consider a Separate Table

A separate timer table would make sense if:
- Historical timer events need to be tracked
- Multiple timers per auction are needed
- Timer state needs to be queried independently
- Timer data grows significantly (e.g., storing all pause/resume events)

## Implementation Details

### State Management

The timer uses three fields to maintain state:

1. **`timer_last_reset_at`**: Authoritative timestamp when timer was last started/resumed
   - Set to current time on reset
   - Adjusted on resume to account for paused duration
   - Used to calculate elapsed time

2. **`timer_paused`**: Boolean flag indicating if timer is currently paused
   - `true` = timer is paused
   - `false` = timer is running

3. **`timer_paused_remaining_seconds`**: Seconds remaining when paused
   - Only set when timer is paused
   - `null` when timer is running
   - Used to resume from correct position

### Timer Operations

**Reset:**
```typescript
{
  timer_last_reset_at: new Date().toISOString(),
  timer_paused: false,
  timer_paused_remaining_seconds: null
}
```

**Pause:**
```typescript
const elapsed = (Date.now() - new Date(timer_last_reset_at).getTime()) / 1000
const remaining = Math.max(0, Math.floor(timer_seconds - elapsed))
{
  timer_paused: true,
  timer_paused_remaining_seconds: remaining
}
```

**Resume:**
```typescript
const adjustedStart = new Date(Date.now() - (timer_seconds - remaining) * 1000).toISOString()
{
  timer_paused: false,
  timer_paused_remaining_seconds: null,
  timer_last_reset_at: adjustedStart
}
```

### Client-Side Calculation

The client calculates remaining time based on server state:

```typescript
if (paused) {
  remainingSeconds = timer_paused_remaining_seconds
} else {
  const elapsed = (now - new Date(timer_last_reset_at).getTime()) / 1000
  remainingSeconds = Math.max(0, Math.floor(timer_seconds - elapsed))
}
```

## UI Implementation

### Smooth Animation
- Uses CSS `transition` instead of `animation` with `animationDelay`
- Updates every 100ms for smooth visual feedback
- Progress bar width calculated as percentage: `(remaining / duration) * 100`

### Timer States
1. **Running**: Green/yellow/red gradient based on remaining time
2. **Paused**: Shows current position, displays "Paused" badge
3. **Expired**: Shows 0%, displays "Expired" badge, shows Reset button

### Control Buttons
- **Running**: Shows "Pause" button
- **Paused**: Shows "Resume" button  
- **Expired**: Shows "Reset" button (highlighted in gold)

## Performance Considerations

1. **Database Load**: Minimal - timer state is small and always needed
2. **Network Traffic**: No additional requests - timer state included in auction data
3. **Client Updates**: 100ms interval for smooth UX (10 updates/second)
4. **Realtime Sync**: Timer state changes broadcast via Supabase realtime

## Future Enhancements

If timer requirements grow, consider:
1. **Timer History**: Track all pause/resume/reset events in separate table
2. **Per-Player Timers**: Store timer state per player in `auction_players` table
3. **Timer Presets**: Allow multiple timer configurations per auction
4. **Auto-Actions**: Trigger actions (skip, sell) when timer expires

## Conclusion

The current design of storing timer state in the `auctions` table is appropriate for the current requirements. It provides:
- Simple, maintainable code
- Efficient queries
- Atomic updates
- No unnecessary complexity

The design can be evolved if requirements change, but the current approach follows the principle of "simplest thing that works."
