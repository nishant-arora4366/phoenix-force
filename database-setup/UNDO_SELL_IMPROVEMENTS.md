# Undo Sell Logic Improvements

## Problem
The original undo sell functionality was unreliable because it used `display_order` to determine which player to undo, but `display_order` doesn't reflect the actual selling sequence. This caused the system to sometimes undo the wrong player.

## Root Cause
1. **Missing Database Fields**: The `auction_players` table was missing several important fields:
   - `display_order`: Order in which players appear in auction
   - `current_player`: Boolean flag for the current player up for bidding
   - `sold_at`: Timestamp when player was sold (critical for undo logic)
   - `times_skipped`: Count of times player was skipped

2. **Incorrect Undo Logic**: The undo logic used `display_order` instead of actual selling timestamp, making it unreliable.

## Solution

### 1. Database Schema Enhancement
**File**: `database-setup/schema/auction-players-enhancement.sql`

Added missing columns to `auction_players` table:
```sql
ALTER TABLE auction_players 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_player BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS times_skipped INTEGER DEFAULT 0;
```

Added performance indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_auction_players_display_order ON auction_players(auction_id, display_order);
CREATE INDEX IF NOT EXISTS idx_auction_players_current_player ON auction_players(auction_id, current_player);
CREATE INDEX IF NOT EXISTS idx_auction_players_sold_at ON auction_players(auction_id, sold_at);
CREATE INDEX IF NOT EXISTS idx_auction_players_status ON auction_players(auction_id, status);
```

### 2. Updated Sell Player Logic
**File**: `app/api/auctions/route.ts`

When a player is sold, now sets the `sold_at` timestamp:
```typescript
.update({
  status: 'sold',
  sold_to: team_id,
  sold_price: sold_price,
  sold_at: new Date().toISOString(),  // ← NEW: Set sold timestamp
  current_player: false
})
```

### 3. Improved Undo Logic
**File**: `app/api/auctions/[id]/undo-player-assignment/route.ts`

Changed from using `display_order` to using `sold_at` timestamp:
```typescript
// OLD (unreliable):
.order('display_order', { ascending: false })

// NEW (reliable):
.not('sold_at', 'is', null)
.order('sold_at', { ascending: false })
```

When undoing, now clears the `sold_at` timestamp:
```typescript
.update({
  status: 'available',
  sold_to: null,
  sold_price: null,
  sold_at: null,  // ← NEW: Clear sold timestamp
  current_player: true
})
```

## How It Works Now

### Selling a Player
1. Player is marked as `sold` with `sold_at` timestamp
2. Team statistics are updated
3. Next player is set as current

### Undoing a Sale
1. **Find Last Sold Player**: Query finds the most recently sold non-captain player using `sold_at` timestamp
2. **Undo the Sale**: Player status is reset to `available`, `sold_at` is cleared
3. **Refund Team**: Team gets money back, player count decreases
4. **Set as Current**: The undone player becomes the current player for bidding

### Key Benefits
- **Reliable Order**: Always undoes the most recently sold player
- **Chronological Accuracy**: Uses actual selling time, not display order
- **Captain Protection**: Still excludes captains from undo operations
- **Performance**: Proper indexes for fast queries

## Testing

**File**: `database-setup/test-undo-logic.sql`

Contains test queries to verify:
- New columns exist
- Functions are created
- Undo logic works correctly
- Selling order is preserved

## Migration Steps

1. **Run Database Migration**:
   ```bash
   # Apply the schema changes
   psql -d your_database -f database-setup/schema/auction-players-enhancement.sql
   ```

2. **Deploy Code Changes**:
   - The API changes are already implemented
   - No frontend changes needed

3. **Verify**:
   ```bash
   # Run test queries
   psql -d your_database -f database-setup/test-undo-logic.sql
   ```

## Backward Compatibility

- **Existing Data**: The migration handles existing records by setting `display_order` based on `created_at`
- **API Compatibility**: No breaking changes to existing API endpoints
- **Frontend**: No changes needed to the frontend code

## Future Improvements

1. **Audit Trail**: Could add `undone_at` timestamp when undoing
2. **Undo History**: Track who undid what and when
3. **Validation**: Add checks to prevent undoing if auction is completed
4. **Batch Operations**: Support undoing multiple players at once
